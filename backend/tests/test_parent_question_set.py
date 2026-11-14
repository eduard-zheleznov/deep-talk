import json
from pathlib import Path

from server import include_global_question_sets


def test_parent_question_set_is_global_and_disabled_by_default():
    catalog = json.loads(
        (Path(__file__).resolve().parents[1] / "parent_question_set.json").read_text(encoding="utf-8")
    )

    assert catalog["id"] == "set_for_parents"
    assert catalog["name"] == "Для родителей"
    assert catalog["enabled"] is False
    assert len(catalog["subcategories"]) == 10
    assert [len(category["questions"]) for category in catalog["subcategories"]] == [10] * 10


def test_global_set_is_added_without_changing_base_set_and_preserves_selection():
    base = {"id": "set_default", "type": "question_set", "name": "Базовый набор № 1", "enabled": True}

    result = include_global_question_sets([base])

    assert result[0] == base
    parent_set = result[1]
    assert parent_set["id"] == "set_for_parents"
    assert parent_set["enabled"] is False
    assert len(parent_set["subcategories"]) == 10

    selected = include_global_question_sets([
        base,
        {"id": "set_for_parents", "enabled": True, "subcategories": [
            {"id": parent_set["subcategories"][0]["id"], "enabled": False, "disabledQuestions": [2]}
        ]},
    ])
    saved_parent = selected[1]
    assert saved_parent["enabled"] is True
    assert saved_parent["subcategories"][0]["enabled"] is False
    assert saved_parent["subcategories"][0]["disabledQuestions"] == [2]
