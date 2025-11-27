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
        string certificate_number;
        string student_id;
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
    
    address public admin;
    IUserRegistry public userRegistry;

    event CertificateIssued(
        bytes32 indexed cert_hash,
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
        string memory certificate_number,
        string memory student_id,
        string memory student_name,
        string memory degree_program,
        uint16 cgpa,
        string memory issuing_authority,
        bytes memory signature
    ) external onlyAuthorized {
        require(!certificate_exists[cert_hash], "Certificate already exists");
        require(cgpa <= 400, "Invalid CGPA");

        certificates[cert_hash] = Certificate({
            cert_hash: cert_hash,
            certificate_number: certificate_number,
            student_id: student_id,
            student_name: student_name,
            degree_program: degree_program,
            cgpa: cgpa,
            issuing_authority: issuing_authority,
            issuer: msg.sender,
            is_revoked: false,
            signature: signature,
            issuance_date: block.timestamp
        });

        certificate_exists[cert_hash] = true;

        emit CertificateIssued(cert_hash, msg.sender, block.number);
    }

    function verifyCertificate(bytes32 cert_hash)
        external
        view
        returns (
            string memory certificate_number,
            string memory student_id,
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
            cert.certificate_number,
            cert.student_id,
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

        certificates[cert_hash].is_revoked = true;

        emit CertificateRevoked(cert_hash, msg.sender, block.number);
    }

    function reactivateCertificate(bytes32 cert_hash) external {
        require(certificate_exists[cert_hash], "Certificate does not exist");

        certificates[cert_hash].is_revoked = false;

        emit CertificateReactivated(cert_hash, msg.sender, block.number);
    }
}
