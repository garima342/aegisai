"""Script to generate synthetic biased HR recruitment dataset and train an audit model.

Generates:
- sample_data/hr_recruitment.csv (2000 rows, biased on gender, missing values, class imbalance)
- sample_data/hr_model.joblib (Trained scikit-learn model inheriting gender disparity)
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def generate_hr_dataset(output_dir: Path | None = None) -> tuple[pd.DataFrame, Pipeline]:
    """Generate reproducible 2000-row HR dataset and train an audit model."""
    if output_dir is None:
        output_dir = Path(__file__).parent

    output_dir.mkdir(parents=True, exist_ok=True)
    np.random.seed(42)

    n_samples = 2000

    # 1. Candidate IDs
    candidate_ids = [f"CAN-{i:05d}" for i in range(1, n_samples + 1)]

    # 2. Gender distribution (~52% Male, 48% Female)
    gender = np.random.choice(["Male", "Female"], size=n_samples, p=[0.52, 0.48])

    # 3. Demographics and features
    age = np.random.randint(22, 58, size=n_samples)
    years_experience = np.clip(np.random.normal(5.0, 3.5, size=n_samples), 0, 25).round(1)
    technical_score = np.clip(np.random.normal(70.0, 15.0, size=n_samples), 10, 100).round(1)
    interview_score = np.clip(np.random.normal(68.0, 14.0, size=n_samples), 15, 100).round(1)

    # 4. Referral source with ~8.5% missing values (triggers DQ-001 missing values medium)
    sources = ["Employee Referral", "LinkedIn", "Campus", "Job Board", "Internal"]
    referral_source = np.random.choice(sources, size=n_samples, p=[0.25, 0.35, 0.15, 0.15, 0.10]).astype(object)
    missing_indices = np.random.choice(n_samples, size=int(n_samples * 0.085), replace=False)
    referral_source[missing_indices] = None

    # 5. Certifications count with ~6.5% IQR outliers (triggers DQ-004 IQR outliers medium)
    # Typical values: 0 to 2. Outlier cluster: 6 to 9.
    certs = np.random.choice([0, 1, 2], size=n_samples, p=[0.60, 0.30, 0.10])
    outlier_indices = np.random.choice(n_samples, size=int(n_samples * 0.065), replace=False)
    certs[outlier_indices] = np.random.randint(6, 10, size=len(outlier_indices))

    # 6. Biased hiring decision (hired):
    # Merit score combines technical + interview + experience
    merit = (technical_score * 0.45) + (interview_score * 0.35) + (years_experience * 2.0)
    # Deliberate demographic disparity penalty applied against female applicants
    # creates ~0.55 demographic parity ratio (< 0.8 four-fifths threshold)
    gender_bias_penalty = np.where(gender == "Female", 14.0, 0.0)
    adjusted_score = merit - gender_bias_penalty

    # Target class imbalance: top ~18% hired (triggers DQ-007 class imbalance medium)
    cutoff = np.percentile(adjusted_score, 82.0)
    hired = (adjusted_score >= cutoff).astype(int)

    df = pd.DataFrame({
        "candidate_id": candidate_ids,
        "gender": gender,
        "age": age,
        "years_experience": years_experience,
        "technical_score": technical_score,
        "interview_score": interview_score,
        "referral_source": referral_source,
        "certifications_count": certs,
        "hired": hired,
    })

    # Train audit model with scikit-learn pipeline
    num_cols = ["age", "years_experience", "technical_score", "interview_score", "certifications_count"]
    cat_cols = ["gender"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(drop="first"), cat_cols),
        ]
    )

    model = Pipeline([
        ("prep", preprocessor),
        ("rf", RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)),
    ])

    feature_cols = num_cols + cat_cols
    X = df[feature_cols]
    y = df["hired"]
    model.fit(X, y)

    # Save CSV and model
    csv_path = output_dir / "hr_recruitment.csv"
    model_path = output_dir / "hr_model.joblib"

    df.to_csv(csv_path, index=False)
    joblib.dump(model, model_path)

    # Verify key properties
    male_mask = df["gender"] == "Male"
    female_mask = df["gender"] == "Female"
    male_rate = df.loc[male_mask, "hired"].mean()
    female_rate = df.loc[female_mask, "hired"].mean()
    dp_ratio = female_rate / male_rate if male_rate > 0 else 0.0
    missing_pct = df["referral_source"].isna().mean() * 100

    print(f"Generated {len(df)} records.")
    print(f"Male selection rate: {male_rate:.4f}")
    print(f"Female selection rate: {female_rate:.4f}")
    print(f"Demographic parity ratio: {dp_ratio:.4f} (Violates 0.80 rule: {dp_ratio < 0.80})")
    print(f"Referral source missing: {missing_pct:.2f}%")
    print(f"Hired positive rate: {df['hired'].mean() * 100:.2f}%")
    print(f"Saved dataset to {csv_path}")
    print(f"Saved model to {model_path}")

    return df, model


if __name__ == "__main__":
    generate_hr_dataset()
