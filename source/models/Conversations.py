from google.appengine.ext import ndb
import datetime


class Conversations(ndb.Model):
    owner = ndb.KeyProperty(indexed=True, kind='Users')
    name = ndb.StringProperty()
    password = ndb.StringProperty() #bcrypt hash value
    createDate = ndb.DateTimeProperty()
    destroyDate = ndb.DateTimeProperty(indexed=True)
    users = ndb.KeyProperty(repeated=True, kind='Users')
    idPolicy = ndb.StringProperty() #???
    viewAfterExpire = ndb.BooleanProperty()
    revealOwner = ndb.BooleanProperty()
    restrictComms = ndb.StringProperty() #???

    def get_conversation_users(self):
        return self.users

    def check_conversation_password(self, convID, passwordHash):
        #use bcrypt to check pw hash param against stored
        #conversation password value
        return False

    @classmethod
    def get_all_conversations(self):
        return Conversations.query().fetch()

    @classmethod
    def get_all_active_conversations(self):
        return Conversations.query(Conversations.destroyDate > datetime.datetime.now())

    @classmethod
    def get_conversation_by_id(self, convID):
        return ndb.Key('Conversations', long(convID)).get()

    @classmethod
    def get_conversation_by_owner(self, ownerID):
        return ndb.query(Conversations.owner == ownerID)

