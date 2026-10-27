import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from question_priority import aggregate_question_priority, priority_key


def test_aggregate_counts_unique_members_and_completion_dominates_skip():
    result = aggregate_question_priority([
        {"question_id": "q1", "user_id": "u1", "status": "skipped"},
        {"question_id": "q1", "user_id": "u1", "status": "completed"},
        {"question_id": "q1", "user_id": "u2", "status": "skipped"},
        {"question_id": "q1", "user_id": "u2", "status": "skipped"},
    ])

    assert result["q1"] == {"completed_count": 1, "skipped_count": 1}


def test_completion_counts_every_participant_who_discussed_together():
    result = aggregate_question_priority([
        {
            "question_id": "q1",
            "user_id": "host",
            "status": "completed",
            "answered_with_users": ["guest", "former-member"],
        },
    ], member_ids=["host", "guest"])

    assert result["q1"] == {"completed_count": 2, "skipped_count": 0}


def test_priority_orders_unseen_then_skipped_then_completed():
    priorities = [
        {"name": "completed", "completed_count": 1, "skipped_count": 0},
        {"name": "skipped", "completed_count": 0, "skipped_count": 3},
        {"name": "unseen", "completed_count": 0, "skipped_count": 0},
    ]

    assert [item["name"] for item in sorted(priorities, key=priority_key)] == [
        "unseen",
        "skipped",
        "completed",
    ]
