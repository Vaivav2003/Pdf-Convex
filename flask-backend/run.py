import os
import secrets
from datetime import datetime
from flask import Flask, request, jsonify, send_file, Response, stream_with_context
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, UserMixin, current_user, logout_user
from flask_cors import CORS
from convex import ConvexClient
from MLmodel.project_convex.model import *
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv()

# Creating convex client object
client = ConvexClient(os.getenv("CONVEX_URL"))

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.init_app(app)

app.config['SESSION_COOKIE_SECURE'] = True 
app.config['SESSION_COOKIE_SAMESITE'] = 'None'


class User(UserMixin):
    def __init__(self, id_of_user, username, email, password):
        self.id = id_of_user
        self.username = username
        self.email = email
        self.password = password

    def get_id(self):
        return self.id


@login_manager.user_loader
def load_user(user_id):
    exist_user = client.query("tasks:get_user", dict(_id=user_id))
    user = User(user_id, exist_user["username"], exist_user["email"], exist_user["password"])
    return user


@app.route('/question', methods=['POST'])
def question():
    if request.is_json:
        data = request.get_json()
        user_query = data.get('question', None)

        if user_query is None:
            return jsonify({'error': 'No question provided'}),400

        user_query = str(user_query)
        prompt = vector_search(user_query)
        return Response(stream_with_context(query(prompt)), content_type='text/plain')

    else:
        return jsonify({"error": "Request must be JSON"}), 400


@app.route('/registration', methods=['POST'])
def registration():
    if request.is_json:
        data = request.get_json()

        username = data.get('username')
        email = data.get('email')

        exist_user = client.query("tasks:check_email", dict(email=email))
        if exist_user:
            return jsonify({'error': 'Email already exist'})
        
        hashed_password = bcrypt.generate_password_hash(data.get('password')).decode('utf-8')
        client.mutation("tasks:createAccount", dict(username=username, email=email, password=hashed_password))
        
        return jsonify({'message': 'Successfully Registered'})

    else:
        return jsonify({"error": "Request must be JSON"}), 400


@app.route('/login', methods=['POST'])
def login():
    if request.is_json:
        data = request.get_json()

        email = data.get('email')
        exist_user = client.query("tasks:check_email", dict(email=email))
        if exist_user is None:
            return jsonify({"error": "Email is not registered"})

        password = data.get('password')
        if bcrypt.check_password_hash(exist_user["password"], password):
            user = User(exist_user["_id"], exist_user["username"], exist_user["email"], exist_user["password"])
            login_user(user)
            return jsonify({"message": "Login successful"})
        else:
            return jsonify({"error": "Invalid Password"})

    else:
        return jsonify({"error": "Request must be JSON"}), 400


def save_pdf(pdf):
    # just to make file name unique
    random_hex = secrets.token_hex(8)
    # .filename to extract filename from the uploaded pic
    f_name, f_ext = os.path.splitext(pdf.filename)
    pdf_fn = random_hex + f_ext
    # now we need to get full path where this pdf will be stored
    save_pdf_path = os.path.join(app.root_path, 'pdf_files', pdf_fn)
    # save pdf to that path
    pdf.save(save_pdf_path)
    # returning pdf name so we can use it to change in database
    return pdf_fn


@app.route('/upload', methods=['POST'])
def upload_pdf():
    if not current_user.is_authenticated:
        return jsonify({'error': 'user is not logged in!'})

    if 'pdf_file' not in request.files:
        return jsonify({'error': "pdf file not found"})

    pdf_array = request.files.getlist('pdf_file')

    for pdf in pdf_array:
        actual_pdf_name = pdf.filename
        pdf_name = save_pdf(pdf)
        user_id = current_user.id
        upload_date = datetime.now().strftime('%d-%m-%Y %H-%M-%S')
        client.mutation("tasks:pdf_history", dict(pdf_name=pdf_name, actual_pdf_name=actual_pdf_name, user_id=user_id, upload_date=upload_date))

    return jsonify({'message': 'All PDF uploaded successfully'})


@app.route('/selected', methods=['POST'])
def select_pdf():
    if request.is_json:
        data = request.get_json()

    if 'selected_pdf_files' not in data:
        return jsonify({'error': "pdf file not selected"})

    selected_pdf_name_array = data.get("selected_pdf_files")

    if len(selected_pdf_name_array) == 0:
        return jsonify({'error': "pdf file not selected"})

    # clear_documents()
    pdf_array = []
    for pdf_name in selected_pdf_name_array:
        file_path = os.path.join(app.root_path, 'pdf_files', pdf_name)
        _pdf_file = pymupdf.open(file_path)
        pdf_array.append(_pdf_file)

    insert_pdf_vectordb(pdf_array)
    return jsonify({'message': 'All PDF selected successfully'})


@app.route('/download/<string:file_id>')
def get_pdf(file_id):
    pdf=client.query("tasks:get_pdf_name", dict(_id=file_id))
    if not pdf:
        return jsonify({"error": "no pdf"})
    pdf_name = pdf.get("pdf_name")
    actual_name = pdf.get("actual_pdf_name")
    path = os.path.join(app.root_path, 'pdf_files', pdf_name)

    return send_file(path_or_file=path, as_attachment=True,
        download_name=str(actual_name), mimetype='application/pdf')


@app.route('/delete/<string:file_id>')
def delete_pdf(file_id):
    pdf = client.query("tasks:get_pdf_name", dict(_id=file_id))
    print(pdf)
    pdf_name = pdf.get("pdf_name")
    client.mutation("tasks:deletepdf", dict(id=file_id))
    path = os.path.join(app.root_path, 'pdf_files', pdf_name)
    os.remove(path)

    return jsonify({"message": "Pdf deleted successfully"})


@app.route('/history')
def history():
    if not current_user.is_authenticated:
        return jsonify({'error': 'user is not logged in!'})

    usr_id = current_user.id
    _history = client.query("tasks:pdf_details", dict(user_id=usr_id))
    return jsonify({'history': _history})


@app.route('/logout')
def logout():
    print("logout")
    if not current_user.is_authenticated:
        return jsonify({'error': 'user is not logged in! ,Cant logout'})

    logout_user_name = current_user.username
    logout_user()
    return jsonify({'message': '{} is logged out'.format(logout_user_name)})


@app.route('/account')
def account():
    if not current_user.is_authenticated:
        return jsonify({'error': 'user is not logged in!, Cant show account'})
    return jsonify({"message": "{} is currently logged in".format(current_user.username)})


if __name__ == '__main__':
    app.run(debug=True)
