let users = [];

function addUser(id, username, room) {
    removeUser(id); // prevent duplicates on reconnect
    const user = { id, username, room };
    users.push(user);
    return user;
}

function removeUser(id) {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

function getUsers(room) {
    return users.filter(user => user.room === room);
}

module.exports = { addUser, removeUser, getUsers };