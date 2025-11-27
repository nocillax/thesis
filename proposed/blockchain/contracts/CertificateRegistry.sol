// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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
        string issuer_name;  // Store issuer's name immutably on blockchain
        bool is_revoked;
        bytes signature;
        uint256 issuance_date;
    }

    mapping(bytes32 => Certificate) private certificates;
    mapping(bytes32 => bool) private certificate_exists;
    mapping(address => string) private issuer_names;  // Immutable name registry
    
    address public admin;

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

    constructor() {
        admin = msg.sender;
    }

    function registerIssuer(string memory name) external {
        require(bytes(name).length > 0, "Name cannot be empty");
        issuer_names[msg.sender] = name;
    }

    function getIssuerName(address issuer) external view returns (string memory) {
        return issuer_names[issuer];
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
    ) external {
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
            issuer_name: issuer_names[msg.sender],
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
            string memory issuer_name,
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
            cert.issuer_name,
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
