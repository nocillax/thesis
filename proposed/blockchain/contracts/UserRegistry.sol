// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserRegistry {
    struct User {
        address wallet_address;
        string username;
        string email;
        uint256 registration_date;
        bool is_authorized;
    }

    mapping(address => User) private users;
    mapping(address => bool) private user_exists;
    mapping(string => address) private email_to_address;  // Reverse lookup
    
    address public admin;

    event UserRegistered(
        address indexed wallet_address,
        string username,
        string email,
        uint256 registration_date
    );

    event UserRevoked(address indexed wallet_address);
    event UserReactivated(address indexed wallet_address);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerUser(
        address wallet_address,
        string memory username,
        string memory email
    ) external onlyAdmin {
        require(!user_exists[wallet_address], "User already registered");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(bytes(email).length > 0, "Email cannot be empty");
        require(email_to_address[email] == address(0), "Email already registered");

        users[wallet_address] = User({
            wallet_address: wallet_address,
            username: username,
            email: email,
            registration_date: block.timestamp,
            is_authorized: true
        });

        user_exists[wallet_address] = true;
        email_to_address[email] = wallet_address;

        emit UserRegistered(wallet_address, username, email, block.timestamp);
    }

    function getUser(address wallet_address)
        external
        view
        returns (
            string memory username,
            string memory email,
            uint256 registration_date,
            bool is_authorized
        )
    {
        require(user_exists[wallet_address], "User not found");
        User memory user = users[wallet_address];
        
        return (
            user.username,
            user.email,
            user.registration_date,
            user.is_authorized
        );
    }

    function getUserByEmail(string memory email)
        external
        view
        returns (
            address wallet_address,
            string memory username,
            uint256 registration_date,
            bool is_authorized
        )
    {
        address addr = email_to_address[email];
        require(addr != address(0), "Email not found");
        
        User memory user = users[addr];
        
        return (
            user.wallet_address,
            user.username,
            user.registration_date,
            user.is_authorized
        );
    }

    function revokeUser(address wallet_address) external onlyAdmin {
        require(user_exists[wallet_address], "User not found");
        require(wallet_address != admin, "Cannot revoke admin");
        users[wallet_address].is_authorized = false;
        emit UserRevoked(wallet_address);
    }

    function reactivateUser(address wallet_address) external onlyAdmin {
        require(user_exists[wallet_address], "User not found");
        users[wallet_address].is_authorized = true;
        emit UserReactivated(wallet_address);
    }

    function isAuthorized(address wallet_address) external view returns (bool) {
        if (!user_exists[wallet_address]) {
            return false;
        }
        return users[wallet_address].is_authorized;
    }

    function userExists(address wallet_address) external view returns (bool) {
        return user_exists[wallet_address];
    }
}
