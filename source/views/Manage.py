from source.framework.BaseHandler import BaseHandler



class ManagePage(BaseHandler):
    def get(self):
        template_values = {}



        self.render_template('app/ManagePage.html', template_values)
