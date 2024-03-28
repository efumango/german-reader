def test_signup(client):
    # Successful registration
    response = client.post('/auth/signup', json={'username': 'newuser', 'password': 'newpassword'})
    assert response.status_code == 201
    assert 'User registered successfully' in response.get_json()['message']

    # Duplicate registration
    response = client.post('/auth/signup', json={'username': 'newuser', 'password': 'newpassword'})
    assert response.status_code == 409
    assert 'Username already exists' in response.get_json()['message']

def test_login(client, new_user):
    # Successful login
    response = client.post('/auth/login', json={'username': 'testuser', 'password': 'testpassword'})
    assert response.status_code == 200
    assert 'token' in response.get_json()['user']

    # Invalid credentials
    response = client.post('/auth/login', json={'username': 'testuser', 'password': 'wrongpassword'})
    assert response.status_code == 401
    assert 'Invalid credentials' in response.get_json()['msg']