from celery import Celery

# Define the Celery instance at the module level.
celery = Celery(__name__, broker='amqp://guest:guest@localhost', backend='rpc://', imports=('dict.dictionary_services'))

def init_celery(app):
    celery.conf.update(app.config)
    
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
                
    celery.Task = ContextTask
