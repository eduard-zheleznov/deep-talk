from collections import defaultdict


def aggregate_question_priority(progress, member_ids=None):
    """Return unique member counts, with completion dominating a prior skip."""
    allowed_members = set(member_ids or [])
    by_question = defaultdict(lambda: {"completed": set(), "skipped": set()})

    for item in progress:
        question_id = item.get("question_id")
        user_id = item.get("user_id")
        status = getattr(item.get("status"), "value", item.get("status"))
        if not question_id or not user_id or status not in {"completed", "skipped"}:
            continue

        bucket = by_question[question_id]
        if status == "completed":
            discussed_by = {user_id, *item.get("answered_with_users", [])}
            if allowed_members:
                discussed_by &= allowed_members
            bucket["completed"].update(discussed_by)
            bucket["skipped"].difference_update(discussed_by)
        elif (not allowed_members or user_id in allowed_members) and user_id not in bucket["completed"]:
            bucket["skipped"].add(user_id)

    return {
        question_id: {
            "completed_count": len(users["completed"]),
            "skipped_count": len(users["skipped"]),
        }
        for question_id, users in by_question.items()
    }


def priority_key(stats):
    return (
        max(0, int(stats.get("completed_count", 0))),
        max(0, int(stats.get("skipped_count", 0))),
    )
