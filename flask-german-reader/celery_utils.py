# celery_utils.py
from celery import Celery
from config import DevelopmentConfig

celery = Celery(__name__)

def init_celery(celery, app):
    celery.main = app.import_name
    celery.conf.update(app.config)
    
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask

    print("Celery Broker URL:", celery.conf['broker_url'])
    print("Celery Result Backend:", celery.conf['result_backend'])
