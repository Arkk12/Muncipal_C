from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
from datetime import datetime

from config import Config
from models import db, Complaint
from ai_compare import compare_before_after   # Make sure you have updated ai_compare.py too

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

# Create folders safely
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(os.getcwd(), 'static'), exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

# ==================== CITIZEN SIDE ====================
@app.route('/file-complaint', methods=['GET', 'POST'])
def file_complaint():
    if request.method == 'POST':
        title = request.form['title']
        desc = request.form['description']
        location = request.form['location']
        
        if 'before_photo' not in request.files:
            flash('No photo uploaded!', 'danger')
            return redirect(request.url)
            
        file = request.files['before_photo']
        if file.filename == '' or not allowed_file(file.filename):
            flash('Invalid file. Only JPG/PNG allowed.', 'danger')
            return redirect(request.url)
        
        filename = secure_filename(f"before_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        new_complaint = Complaint(
            title=title,
            description=desc,
            location=location,
            before_photo=filename,
            status='Pending'
        )
        db.session.add(new_complaint)
        db.session.commit()
        
        flash('Complaint filed successfully! Admin will review it.', 'success')
        return redirect(url_for('success'))
    
    return render_template('complaint.html')

@app.route('/success')
def success():
    return render_template('success.html')

# ==================== ADMIN SIDE ====================
@app.route('/admin')
def admin_dashboard():
    complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    return render_template('admin_dashboard.html', complaints=complaints)

@app.route('/assign/<int:comp_id>', methods=['POST'])
def assign_task(comp_id):
    complaint = Complaint.query.get_or_404(comp_id)
    worker = request.form.get('worker', 'Unknown Worker')
    complaint.assigned_to = worker
    complaint.status = 'Assigned'
    db.session.commit()
    flash(f'Task assigned to {worker}', 'success')
    return redirect(url_for('admin_dashboard'))

# ==================== WORKER SIDE ====================
@app.route('/worker')
def worker_dashboard():
    complaints = Complaint.query.filter_by(status='Assigned').all()
    return render_template('worker_dashboard.html', complaints=complaints)

@app.route('/complete/<int:comp_id>', methods=['POST'])
def complete_work(comp_id):
    complaint = Complaint.query.get_or_404(comp_id)
    
    if 'after_photo' not in request.files:
        flash('Please upload after photo', 'danger')
        return redirect(url_for('worker_dashboard'))
    
    file = request.files['after_photo']
    if file.filename == '' or not allowed_file(file.filename):
        flash('Invalid file. Only JPG/PNG allowed.', 'danger')
        return redirect(url_for('worker_dashboard'))
    
    # Save after photo
    filename = secure_filename(f"after_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    complaint.after_photo = filename
    complaint.status = 'In Progress'
    
    # AI Comparison with NEW LOGIC (similarity < 20% = Success)
    before_path = os.path.join(app.config['UPLOAD_FOLDER'], complaint.before_photo)
    after_path = filepath
    
    is_fixed, similarity, remark = compare_before_after(before_path, after_path)
    
    complaint.ai_similarity = similarity
    
    if is_fixed:
        complaint.status = 'Work Done'
        flash(remark, 'success')
    else:
        complaint.status = 'Assigned'   # Send back to worker for re-work
        flash(remark, 'danger')
    
    db.session.commit()
    return redirect(url_for('worker_dashboard'))

# Serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)