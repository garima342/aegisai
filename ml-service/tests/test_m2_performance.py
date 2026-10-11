"""Unit tests for safe model loading and performance evaluation (MOD-001, MOD-002)."""

import io

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier

from app.m2.performance import evaluate_model_performance, is_model_loading_allowed, safe_load_model


def test_safe_load_model_forbidden_when_env_false(monkeypatch, tmp_path):
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "false")
    assert not is_model_loading_allowed()

    dummy_path = tmp_path / "model.joblib"
    dummy_path.write_text("dummy")

    with pytest.raises(PermissionError) as exc_info:
        safe_load_model(dummy_path)
    assert "disabled by default for security" in str(exc_info.value)


def test_safe_load_model_disallowed_extension(monkeypatch, tmp_path):
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")

    bad_ext_path = tmp_path / "malicious.sh"
    bad_ext_path.write_text("echo hello")

    with pytest.raises(ValueError) as exc_info:
        safe_load_model(bad_ext_path)
    assert "Unsupported model extension" in str(exc_info.value)


def test_safe_load_model_size_limit(monkeypatch):
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")

    # Exceeds 50MB
    huge_bytes = b"0" * (51 * 1024 * 1024)
    with pytest.raises(ValueError) as exc_info:
        safe_load_model(huge_bytes, filename="huge.pkl")
    assert "exceeds maximum allowable size" in str(exc_info.value)


def test_safe_load_model_successful_bytes_and_file(monkeypatch, tmp_path):
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")

    model = LogisticRegression()
    X = [[1, 2], [3, 4], [5, 6], [7, 8]]
    y = [0, 0, 1, 1]
    model.fit(X, y)

    # Test file path loading
    model_file = tmp_path / "test_model.joblib"
    joblib.dump(model, model_file)

    loaded_from_file = safe_load_model(model_file)
    assert loaded_from_file is not None

    # Test bytes loading
    buf = io.BytesIO()
    joblib.dump(model, buf)
    buf.seek(0)
    loaded_from_bytes = safe_load_model(buf.getvalue(), filename="model.joblib")
    assert loaded_from_bytes is not None


def test_evaluate_model_performance_normal():
    np.random.seed(42)
    n = 100
    X = np.random.normal(0, 1, (n, 2))
    y = (X[:, 0] + X[:, 1] > 0).astype(int)

    model = LogisticRegression()
    model.fit(X, y)

    df = pd.DataFrame({"feat1": X[:, 0], "feat2": X[:, 1], "target": y})

    metrics, _ = evaluate_model_performance(
        model=model,
        df=df,
        target_column="target",
        assessment_id="test-asm",
    )

    assert "accuracy" in metrics
    assert "f1" in metrics
    assert "train_accuracy" in metrics
    assert "overfitting_gap" in metrics
    assert metrics["accuracy"] >= 0.80


def test_evaluate_model_performance_overfitting_detected():
    # Construct an overfitted decision tree (depth 20 on small noisy data)
    np.random.seed(42)
    X_train = np.random.normal(0, 1, (80, 15))
    y_train = np.random.choice([0, 1], size=80)

    X_test = np.random.normal(0, 1, (80, 15))
    y_test = np.random.choice([0, 1], size=80)

    cols = [f"f_{i}" for i in range(15)]
    overfitted_tree = DecisionTreeClassifier(max_depth=20, random_state=42)
    overfitted_tree.fit(X_train, y_train)

    df_train = pd.DataFrame(X_train, columns=cols)
    df_train["target"] = y_train

    df_test = pd.DataFrame(X_test, columns=cols)
    df_test["target"] = y_test

    _, findings = evaluate_model_performance(
        model=overfitted_tree,
        df=df_train,
        test_df=df_test,
        target_column="target",
        assessment_id="test-asm",
    )

    gap_findings = [f for f in findings if f.checkId == "MOD-002"]
    assert len(gap_findings) >= 1
    assert gap_findings[0].severity in ("medium", "high")


def test_evaluate_model_performance_low_baseline():
    # Intentionally bad model predicting opposite of target
    class BadModel:
        def predict(self, X):
            return np.zeros(len(X))

    df = pd.DataFrame({"feat": [1, 2, 3, 4, 5] * 20, "target": [1] * 100})
    # Target is all 1s, model predicts all 0s -> 0% accuracy
    _, findings = evaluate_model_performance(
        model=BadModel(),
        df=df,
        target_column="target",
        assessment_id="test-asm",
    )
    assert any(f.checkId == "MOD-001" for f in findings)


def test_performance_error_handling(monkeypatch, tmp_path):
    monkeypatch.setenv("ALLOW_MODEL_LOAD", "true")

    # Missing file
    with pytest.raises(FileNotFoundError):
        safe_load_model(tmp_path / "nonexistent.joblib")

    # Corrupt bytes
    with pytest.raises(RuntimeError):
        safe_load_model(b"corrupt-data", filename="model.joblib")

    # Target column missing
    df = pd.DataFrame({"a": [1, 2, 3]})
    with pytest.raises(ValueError, match="Target column 'y' not found"):
        evaluate_model_performance(None, df, target_column="y")

    # Target column missing in test_df
    df_valid = pd.DataFrame({"a": [1] * 20, "y": [0] * 20})
    test_df_invalid = pd.DataFrame({"a": [1] * 20})
    with pytest.raises(ValueError, match="missing from test dataset"):
        evaluate_model_performance(None, df_valid, target_column="y", test_df=test_df_invalid)

    # Fewer than 10 samples
    df_tiny = pd.DataFrame({"a": [1, 2], "y": [0, 1]})
    with pytest.raises(ValueError, match="fewer than 10 samples"):
        evaluate_model_performance(None, df_tiny, target_column="y")

    # No features left
    df_no_feats = pd.DataFrame({"y": [0, 1] * 10})
    with pytest.raises(ValueError, match="No feature columns"):
        evaluate_model_performance(None, df_no_feats, target_column="y")
