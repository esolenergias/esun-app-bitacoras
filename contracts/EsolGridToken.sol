// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EsolGridToken
 * @dev Contrato Inteligente para la Tokenización de Proyectos Solares de EsolEnergias.
 * Cada token (ej. ESOL-HOTEL) representa 1 Watt de capacidad instalada o una fracción de deuda del PPA.
 */
contract EsolGridToken is ERC20, Ownable {
    
    // Metadatos del proyecto fotovoltaico
    string public projectName;
    uint256 public targetCapitalMXN;
    uint256 public expectedROI; // En puntos base (ej. 1450 = 14.5%)
    string public ppaContractHash; // IPFS hash del contrato legal físico para transparencia
    
    // Estado del proyecto
    bool public isFundingOpen = true;
    uint256 public totalDividendPaid = 0;

    // Eventos para la trazabilidad en la Blockchain
    event InvestmentReceived(address indexed investor, uint256 amount);
    event DividendDistributed(uint256 totalAmount, uint256 timestamp);
    event FundingClosed(uint256 totalRaised);

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        string memory _projectName,
        uint256 _targetCapitalMXN,
        uint256 _expectedROI,
        string memory _ppaContractHash,
        address initialOwner
    ) ERC20(_tokenName, _tokenSymbol) Ownable(initialOwner) {
        projectName = _projectName;
        targetCapitalMXN = _targetCapitalMXN;
        expectedROI = _expectedROI;
        ppaContractHash = _ppaContractHash;
    }

    /**
     * @dev Función para que los usuarios inviertan. (Simplificado para el caso de uso)
     * En producción real, recibiría USDT o USDC en la red Polygon.
     */
    function invest(address investor, uint256 amountTokens) external onlyOwner {
        require(isFundingOpen, "La ronda de inversion esta cerrada");
        
        // Acuñamos (minteamos) los tokens al inversionista
        _mint(investor, amountTokens);
        
        emit InvestmentReceived(investor, amountTokens);

        // Si alcanzamos la meta, cerramos automáticamente
        if (totalSupply() >= targetCapitalMXN) {
            isFundingOpen = false;
            emit FundingClosed(totalSupply());
        }
    }

    /**
     * @dev Función para distribuir dividendos mensuales provenientes del pago de CFE del cliente.
     */
    function distributeDividends() external payable onlyOwner {
        require(!isFundingOpen, "El proyecto aun esta en fase de fondeo");
        require(msg.value > 0, "Debe enviar fondos para distribuir");

        totalDividendPaid += msg.value;
        
        emit DividendDistributed(msg.value, block.timestamp);
        
        // Nota: La dispersión exacta proporcional a cada Wallet 
        // suele hacerse vía "Merkle Trees" o "Snapshot" fuera de cadena (off-chain) 
        // para ahorrar gas, o con un contrato distribuidor dedicado.
    }

    /**
     * @dev Cierre manual de la ronda de inversión por parte de Esol.
     */
    function closeFunding() external onlyOwner {
        isFundingOpen = false;
        emit FundingClosed(totalSupply());
    }
}
