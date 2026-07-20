const fs = require('fs');
let code = fs.readFileSync('esun-bitácoras/app/src/main/java/com/example/data/repository/SyncRepository.kt', 'utf8');

const replacement = `                      val oldBudgetItems = budgetItemDao.getAllBudgetItemsSync()
                      
                      val budgetEntities = filteredConcepts.map { sc ->
                          val obraName = presupuestos.find { it.id == sc.presupuesto_id }?.obra_name ?: sc.presupuesto_id ?: "Obra Desconocida"
                          val codeStr = sc.code ?: sc.id ?: "DESCONOCIDO"
                          val oldItem = oldBudgetItems.find { it.code == codeStr && it.obraId == obraName }
                          val finalExecuted = maxOf(sc.executed_quantity ?: 0.0, oldItem?.executedQuantity ?: 0.0)

                          BudgetItemEntity(
                              code = codeStr,
                              description = sc.description ?: "",
                              quantity = sc.quantity ?: 0.0,
                              unit = sc.unit ?: "",
                              unitPrice = sc.unit_price ?: 0.0,
                              executedQuantity = finalExecuted,
                              totalBudget = sc.total_budget ?: ((sc.quantity ?: 0.0) * (sc.unit_price ?: 0.0)),
                              obraId = obraName
                          )
                      }`;

const regex = /val budgetEntities = filteredConcepts\.map \{ sc ->[\s\S]*?obraId = obraName[\s\S]*?\)[\s\S]*?\}/;
code = code.replace(regex, replacement);
fs.writeFileSync('esun-bitácoras/app/src/main/java/com/example/data/repository/SyncRepository.kt', code);
console.log('Done');
