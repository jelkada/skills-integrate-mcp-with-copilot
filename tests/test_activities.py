from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def test_get_activities_includes_category_metadata():
    response = client.get("/activities")

    assert response.status_code == 200

    data = response.json()
    assert "Chess Club" in data
    assert data["Chess Club"]["category"] == "Academic"
    assert "spots_left" in data["Chess Club"]


def test_signup_rejects_activity_when_full():
    response = client.post(
        "/activities/Programming Class/signup",
        params={"email": "newstudent@mergington.edu"},
    )

    # This activity is already at capacity in the seeded data.
    assert response.status_code == 400
