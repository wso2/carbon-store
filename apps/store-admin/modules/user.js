var isLoginVerified = function(){
    var server=require('store').server;
    var user=server.current(session);
    if (!user){
        return false;
    }else {
        return true;
    }
}

var getLoggedInUser = function(){
    var server=require('store').server;
    var user=server.current(session).username;
    return user;
}