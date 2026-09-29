// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateVerification {

    address public admin;

    struct Certificate {
        string studentName;
        string courseName;
        string certHash;   // SHA-256 hash of certificate data/file
        uint256 issueDate;
        bool exists;
    }

    // certificateId => Certificate
    mapping(string => Certificate) private certificates;

    event CertificateIssued(string certificateId, string studentName, string certHash, uint256 issueDate);
    event CertificateRevoked(string certificateId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Issue a new certificate — only admin (college) can call this
    function issueCertificate(
        string memory _certificateId,
        string memory _studentName,
        string memory _courseName,
        string memory _certHash
    ) public onlyAdmin {
        require(!certificates[_certificateId].exists, "Certificate ID already exists");

        certificates[_certificateId] = Certificate({
            studentName: _studentName,
            courseName: _courseName,
            certHash: _certHash,
            issueDate: block.timestamp,
            exists: true
        });

        emit CertificateIssued(_certificateId, _studentName, _certHash, block.timestamp);
    }

    // Verify certificate by comparing hash
    function verifyCertificate(string memory _certificateId, string memory _certHash)
        public
        view
        returns (bool isValid, string memory studentName, string memory courseName, uint256 issueDate)
    {
        Certificate memory cert = certificates[_certificateId];

        if (!cert.exists) {
            return (false, "", "", 0);
        }

        bool matches = keccak256(abi.encodePacked(cert.certHash)) == keccak256(abi.encodePacked(_certHash));
        return (matches, cert.studentName, cert.courseName, cert.issueDate);
    }

    // Fetch certificate details without hash check (public lookup)
    function getCertificate(string memory _certificateId)
        public
        view
        returns (string memory studentName, string memory courseName, string memory certHash, uint256 issueDate, bool exists)
    {
        Certificate memory cert = certificates[_certificateId];
        return (cert.studentName, cert.courseName, cert.certHash, cert.issueDate, cert.exists);
    }

    // Revoke a certificate (e.g. issued by mistake)
    function revokeCertificate(string memory _certificateId) public onlyAdmin {
        require(certificates[_certificateId].exists, "Certificate does not exist");
        delete certificates[_certificateId];
        emit CertificateRevoked(_certificateId);
    }

    function changeAdmin(address _newAdmin) public onlyAdmin {
        admin = _newAdmin;
    }
}
