# Refer to older versions of this file to find how to test file storage service

import inflection
import json
import requests


def get_entities(backend_url, auth_header):
    response = requests.get(f"{backend_url}/entities", headers=auth_header)
    assert response.status_code == 200
    return response.json()


def get_entity_by_id(backend_url, auth_header, id):
    response = requests.get(
        f"{backend_url}/entities/{id}",
        headers=auth_header,
    )
    assert response.status_code == 200
    return response.json()


# def get_file(backend_url, auth_header, filename):
#     response = requests.get(
#         f"{backend_url}/entities/files/{filename}",
#         headers=auth_header,
#     )
#     assert response.status_code == 200
#     return response.json()


def create_entity(backend_url, auth_header, body):
    form_data = {
        "body": (None, json.dumps(body), 'application/json'),
        "file": ("test.txt", "dummy content", "text/plain") 
    }
    response = requests.post(
        f"{backend_url}/entities/",
        files=form_data,
        headers=auth_header,
        timeout=10
    )
    assert response.status_code == 201
    data = response.json()
    actual = {k: v for k, v in data.items() if k in body}
    assert actual == body
    return data


def update_entity(backend_url, auth_header, id, body):
    form_data = {
        "body": (None, json.dumps(body), 'application/json'),
        "file": ("test.txt", "dummy update content", "text/plain") 
    }
    response = requests.put(
        f"{backend_url}/entities/{id}",
        files=form_data,
        headers=auth_header,
        timeout=10
    )
    assert response.status_code == 200
    data = response.json()
    actual = {k: v for k, v in data.items() if k in body}
    assert actual == body
    return data


def delete_entity(backend_url, auth_header, id):
    response = requests.delete(
        f"{backend_url}/entities/{id}",
        headers=auth_header,
    )
    assert response.status_code == 200


def test_entities(backend_url, auth_header, lang, api):
    if api != "rest":
        return

    body1 = {
        "stringField": "TestScript1",
        "intField": 1,
        "enumField": "A",
        "stringArrayField": ["test1", "test2"],
        "boolField": True,
    }
    body2 = {
        "stringField": "TestScript2",
        "intField": 2,
        "enumField": "B",
        "stringArrayField": ["test2"],
        "boolField": False,
    }

    entity = create_entity(backend_url, auth_header, body1)
    updated_entity = update_entity(
        backend_url, auth_header, entity["id"], body2
    )
    retrieved_entity = get_entity_by_id(backend_url, auth_header, entity["id"])
    assert updated_entity == retrieved_entity
    assert get_entities(backend_url, auth_header)
    delete_entity(backend_url, auth_header, entity["id"])
