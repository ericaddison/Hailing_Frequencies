from source.framework.ApiServiceHandler import ApiServiceHandler, NOT_FOUND_RESPONSE
import source.framework.constants as c
from source.models.Conversations import Conversations, id_policies
from datetime import datetime
import time


# [BEGIN API python methods]

def get_conversations(user, conv_id):
    """Get conversations by name, or get all conversations if no names provided"""
    response = {'status': 200}
    if conv_id == "":
        response['conversations'] = Conversations.get_all_active_conversations_basic_data()
    else:
        conv = Conversations.get_conversation_by_id(conv_id)
        if conv:
            if conv.has_user(user):
                response['conversations'] = conv.get_full_data()
            else:
                response['conversations'] = conv.get_basic_data()
        else:
            return NOT_FOUND_RESPONSE
    return response


def create_conversation(user, name, destroy_date, id_policy, view_after_expire, reveal_owner, restrict_comms, password_hash):
    """Create a new conversation"""
    # check user authorization
    # check_user_auth()...

    # default values
    name = name if name else Conversations.random_name()
    id_policy = id_policy if id_policy in id_policies else "colors"
    destroy_date = destroy_date if destroy_date else datetime.fromtimestamp(time.time()+90*24*3600)
    destroy_date = destroy_date if destroy_date>datetime.now() else datetime.fromtimestamp(time.time()+90*24*3600)
    view_after_expire = False if view_after_expire.lower() == 'false' else True
    reveal_owner = False if reveal_owner.lower() == 'false' else True
    restrict_comms = restrict_comms if restrict_comms else ""
    password_hash = password_hash if password_hash else ""

    conv = Conversations.create(name=name,
                                owner=user,
                                destroy_date=destroy_date,
                                id_policy=id_policy,
                                view_after_expire=view_after_expire,
                                reveal_owner=reveal_owner,
                                restrict_comms=restrict_comms,
                                password_hash=password_hash)

    return {'conversations': conv.get_full_data(), 'status': 200}


def update_conversation(user, conv_id):
    """Update conversation settings"""
    response = {}
    response['conversations'] = "Updated conversation"
    return response


def delete_conversation(user, conv_id):
    """Delete a conversation"""
    response = {}
    response['conversations'] = "Deleted conversation"
    return response

# [END API python methods]


# [BEGIN API handler]

class ConversationsApi(ApiServiceHandler):
    """REST API handler to allow interaction with conversation data"""

    def get_hook(self, user, *args):
        """Get conversation data API"""
        return get_conversations(user, args[0])

    def post_hook(self, user, *args):
        """Create conversation data API"""
        if args[0]:
            return NOT_FOUND_RESPONSE

        # dummy version, for now
        name = self.get_request_param(c.conversastion_name_parm)
        destroy_date = self.get_request_param(c.destroydate_parm)
        id_policy = self.get_request_param(c.idpolicy_parm)
        view_after_expire = self.get_request_param(c.view_after_expire_parm)
        reveal_owner = self.get_request_param(c.reveal_owner_parm)
        restrict_comms = self.get_request_param(c.restrict_comms_parm)
        password = self.get_request_param(c.password_parm)

        return create_conversation(user, name,
                                   destroy_date, id_policy,
                                   view_after_expire, reveal_owner,
                                   restrict_comms, password)

    def put_hook(self, user, *args):
        """Update conversation API"""
        return update_conversation(user, args[0])

    def delete_hook(self, user, *args):
        """Delete conversation API"""
        return delete_conversation(user, args[0])

# [END API handler]
