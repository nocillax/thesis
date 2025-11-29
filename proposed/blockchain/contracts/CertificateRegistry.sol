// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUserRegistry {
    function isAuthorized(address wallet_address) external view returns (bool);
    function getUser(address wallet_address) external view returns (
        string memory username,
        string memory email,
        uint256 registration_date,
        bool is_authorized
    );
}

contract CertificateRegistry {
    struct Certificate {
        bytes32 cert_hash;
        string student_id;
        uint256 version;
        string student_name;
        string degree_program;
        uint16 cgpa;
        string issuing_authority;
        address issuer;
        bool is_revoked;
        bytes signature;
        uint256 issuance_date;
    }

    mapping(bytes32 => Certificate) private certificates;
    mapping(bytes32 => bool) private certificate_exists;
    
    // Version tracking per student
    mapping(string => uint256) public student_to_latest_version;
    mapping(string => mapping(uint256 => bytes32)) public student_version_to_hash;
    mapping(string => bytes32) public student_to_active_cert_hash;
    
    address public admin;
    IUserRegistry public userRegistry;

    event CertificateIssued(
        bytes32 indexed cert_hash,
        string indexed student_id,
        uint256 version,
        address indexed issuer,
        uint256 block_number
    );

    event CertificateRevoked(
        bytes32 indexed cert_hash,
        address indexed revoked_by,
        uint256 block_number
    );

    event CertificateReactivated(
        bytes32 indexed cert_hash,
        address indexed reactivated_by,
        uint256 block_number
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(userRegistry.isAuthorized(msg.sender), "Not authorized to issue certificates");
        _;
    }

    constructor(address _userRegistryAddress) {
        admin = msg.sender;
        userRegistry = IUserRegistry(_userRegistryAddress);
    }

    function issueCertificate(
        bytes32 cert_hash,
        string memory student_id,
        string memory student_name,
        string memory degree_program,
        uint16 cgpa,
        string memory issuing_authority,
        bytes memory signature,
        address issuer_address
    ) external {
        require(userRegistry.isAuthorized(issuer_address), "Provided issuer is not authorized");
        require(msg.sender == admin || msg.sender == issuer_address, "Only admin or the issuer can issue certificates");
        require(!certificate_exists[cert_hash], "Certificate already exists");
        require(cgpa <= 400, "Invalid CGPA");

        uint256 latest_version = student_to_latest_version[student_id];
        
        if (latest_version > 0) {
            bytes32 active_hash = student_to_active_cert_hash[student_id];
            require(active_hash == bytes32(0), 
                    "Student has an active certificate. Revoke it before creating a new version.");
        }
        
        uint256 new_version = latest_version + 1;

        certificates[cert_hash] = Certificate({
            cert_hash: cert_hash,
            student_id: student_id,
            version: new_version,
            student_name: student_name,
            degree_program: degree_program,
            cgpa: cgpa,
            issuing_authority: issuing_authority,
            issuer: issuer_address,
            is_revoked: false,
            signature: signature,
            issuance_date: block.timestamp
        });

        certificate_exists[cert_hash] = true;
        student_to_latest_version[student_id] = new_version;
        student_version_to_hash[student_id][new_version] = cert_hash;
        student_to_active_cert_hash[student_id] = cert_hash;

        emit CertificateIssued(cert_hash, student_id, new_version, issuer_address, block.number);
    }

    function verifyCertificate(bytes32 cert_hash)
        external
        view
        returns (
            string memory student_id,
            uint256 version,
            string memory student_name,
            string memory degree_program,
            uint16 cgpa,
            string memory issuing_authority,
            address issuer,
            bool is_revoked,
            bytes memory signature,
            uint256 issuance_date
        )
    {
        require(certificate_exists[cert_hash], "Certificate does not exist");
        Certificate memory cert = certificates[cert_hash];
        
        return (
            cert.student_id,
            cert.version,
            cert.student_name,
            cert.degree_program,
            cert.cgpa,
            cert.issuing_authority,
            cert.issuer,
            cert.is_revoked,
            cert.signature,
            cert.issuance_date
        );
    }

    function revokeCertificate(bytes32 cert_hash) external {
        require(certificate_exists[cert_hash], "Certificate does not exist");

        Certificate storage cert = certificates[cert_hash];
        cert.is_revoked = true;
        
        // Clear active pointer if this was the active certificate
        if (student_to_active_cert_hash[cert.student_id] == cert_hash) {
            student_to_active_cert_hash[cert.student_id] = bytes32(0);
        }

        emit CertificateRevoked(cert_hash, msg.sender, block.number);
    }

    function reactivateCertificate(bytes32 cert_hash) external {
        require(certificate_exists[cert_hash], "Certificate does not exist");
        
        Certificate storage cert = certificates[cert_hash];
        require(cert.is_revoked, "Certificate is already active");
        
        // Check if another version is active
        bytes32 active_hash = student_to_active_cert_hash[cert.student_id];
        require(active_hash == bytes32(0), 
                "Another version is active. Revoke it first to reactivate this version.");
        
        cert.is_revoked = false;
        student_to_active_cert_hash[cert.student_id] = cert_hash;

        emit CertificateReactivated(cert_hash, msg.sender, block.number);
    }
    
    // Get active certificate for a student
    function getActiveCertificate(string memory student_id)
        external
        view
        returns (Certificate memory)
    {
        bytes32 hash = student_to_active_cert_hash[student_id];
        require(hash != bytes32(0), "No active certificate for this student");
        return certificates[hash];
    }
    
    // Get all certificate hashes for a student
    function getAllVersions(string memory student_id)
        external
        view
        returns (bytes32[] memory)
    {
        uint256 latest = student_to_latest_version[student_id];
        require(latest > 0, "No certificates found for this student");
        
        bytes32[] memory hashes = new bytes32[](latest);
        
        for (uint256 v = 1; v <= latest; v++) {
            hashes[v-1] = student_version_to_hash[student_id][v];
        }
        
        return hashes;
    }
}
