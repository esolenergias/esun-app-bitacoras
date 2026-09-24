const hre = require("hardhat");

async function main() {
  console.log("Iniciando el despliegue del contrato EsolGridToken...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Parámetros de ejemplo para el primer proyecto: Hotel Boutique
  const tokenName = "Esol Hotel Boutique PPA";
  const tokenSymbol = "ESOL-HOTEL";
  const projectName = "Hotel Boutique Centro Histórico - 40kWp";
  const targetCapitalMXN = hre.ethers.parseUnits("600000", 18); // 600,000 Tokens (1 Token = 1 MXN)
  const expectedROI = 1200; // 12.00% (en puntos base)
  const ppaContractHash = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"; // Link al documento legal en IPFS

  const EsolGridToken = await hre.ethers.getContractFactory("EsolGridToken");
  
  const token = await EsolGridToken.deploy(
    tokenName,
    tokenSymbol,
    projectName,
    targetCapitalMXN,
    expectedROI,
    ppaContractHash,
    deployer.address
  );

  await token.waitForDeployment();

  console.log("----------------------------------------------------");
  console.log("✅ Contrato EsolGridToken desplegado exitosamente!");
  console.log("📍 Dirección del Contrato:", await token.getAddress());
  console.log("----------------------------------------------------");
  console.log("Copia la 'Dirección del Contrato' e insértala en tu panel de Esol Grid para que los clientes puedan interactuar con ella.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
