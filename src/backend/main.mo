import Time "mo:core/Time";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import List "mo:core/List";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

actor {
  type Role = {
    #user;
    #assistant;
  };

  type Message = {
    id : Nat;
    role : Role;
    content : Text;
    timestamp : Time.Time;
  };

  type Conversation = {
    id : Nat;
    name : Text;
    messages : List.List<Message>;
    createdAt : Time.Time;
  };

  var currentConversationId = 0;
  var nextMessageId = 0;

  let conversations = Map.singleton<Nat, Conversation>(
    0,
    {
      id = 0;
      name = "Default";
      messages = List.empty<Message>();
      createdAt = Time.now();
    },
  );

  func addMessage(convoId : Nat, role : Role, content : Text) {
    switch (conversations.get(convoId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?convo) {
        let message : Message = {
          id = nextMessageId;
          role;
          content;
          timestamp = Time.now();
        };
        nextMessageId += 1;
        convo.messages.add(message);
      };
    };
  };

  func generateAssistantResponse(_ : Text) : Text {
    "I'm your helpful coding assistant. How can I help you today?";
  };

  public shared ({ caller }) func sendMessage(message : Text) : async Text {
    addMessage(currentConversationId, #user, message);
    let response = generateAssistantResponse(message);
    addMessage(currentConversationId, #assistant, response);
    response;
  };

  public query ({ caller }) func getHistory() : async [Message] {
    switch (conversations.get(currentConversationId)) {
      case (null) { Runtime.trap("No conversation type found") };
      case (?convo) { convo.messages.toArray() };
    };
  };

  public shared ({ caller }) func clearHistory() : async () {
    switch (conversations.get(currentConversationId)) {
      case (null) { Runtime.trap("No conversation type found") };
      case (?convo) { convo.messages.clear() };
    };
  };

  public shared ({ caller }) func createConversation(name : Text) : async Nat {
    let newId = conversations.size();
    let conversation : Conversation = {
      id = newId;
      name;
      messages = List.empty<Message>();
      createdAt = Time.now();
    };
    conversations.add(newId, conversation);
    newId;
  };

  public shared ({ caller }) func switchConversation(id : Nat) : async () {
    if (not conversations.containsKey(id)) {
      Runtime.trap("Conversation with id " # id.toText() # " does not exist");
    };
    currentConversationId := id;
  };

  public query ({ caller }) func getCurrentConversationId() : async Nat {
    currentConversationId;
  };

  public query ({ caller }) func listConversations() : async [(Nat, Text)] {
    conversations.values().map(func(convo) { (convo.id, convo.name) }).toArray();
  };
};
