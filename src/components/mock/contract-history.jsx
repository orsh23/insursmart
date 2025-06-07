// This file provides mock data for contract history since the Contract.getHistory method doesn't exist
// It simulates what a real history endpoint might return

export const mockContractHistory = [
  {
    id: "hist_001",
    contract_id: "CONT-2023-001",
    timestamp: new Date(2023, 5, 15, 14, 30).toISOString(),
    action_type: "created",
    user: { id: "user1", name: "David Cohen" },
    details: "Contract created with initial draft status",
    version: "1.0",
  },
  {
    id: "hist_002",
    contract_id: "CONT-2023-001",
    timestamp: new Date(2023, 5, 16, 9, 45).toISOString(),
    action_type: "updated",
    user: { id: "user2", name: "Sarah Goldman" },
    details: "Updated contract details and pricing structure",
    version: "1.1",
  },
  {
    id: "hist_003",
    contract_id: "CONT-2023-001",
    timestamp: new Date(2023, 5, 18, 11, 20).toISOString(),
    action_type: "added_scope",
    user: { id: "user3", name: "Michael Levy" },
    details: "Added orthopedic procedures to contract scope",
    version: "1.2",
  },
  {
    id: "hist_004",
    contract_id: "CONT-2023-001",
    timestamp: new Date(2023, 5, 22, 16, 15).toISOString(),
    action_type: "tariff_changed",
    user: { id: "user2", name: "Sarah Goldman" },
    details: "Updated tariff rates for imaging procedures",
    version: "1.3",
  },
  {
    id: "hist_005",
    contract_id: "CONT-2023-002",
    timestamp: new Date(2023, 6, 3, 10, 0).toISOString(),
    action_type: "created",
    user: { id: "user1", name: "David Cohen" },
    details: "New contract created for Tel Aviv Medical Center",
    version: "1.0",
  },
  {
    id: "hist_006",
    contract_id: "CONT-2023-002",
    timestamp: new Date(2023, 6, 5, 14, 30).toISOString(),
    action_type: "bonus_added",
    user: { id: "user3", name: "Michael Levy" },
    details: "Added volume-based bonus structure",
    version: "1.1",
  },
  {
    id: "hist_007",
    contract_id: "CONT-2023-001",
    timestamp: new Date(2023, 6, 10, 9, 15).toISOString(),
    action_type: "updated",
    user: { id: "user1", name: "David Cohen" },
    details: "Updated payment terms to Net 45",
    version: "1.4",
  },
  {
    id: "hist_008",
    contract_id: "CONT-2023-003",
    timestamp: new Date(2023, 7, 1, 11, 0).toISOString(),
    action_type: "created",
    user: { id: "user2", name: "Sarah Goldman" },
    details: "New contract created for Haifa General Hospital",
    version: "1.0",
  },
  {
    id: "hist_009",
    contract_id: "CONT-2023-003",
    timestamp: new Date(2023, 7, 3, 15, 45).toISOString(),
    action_type: "updated",
    user: { id: "user2", name: "Sarah Goldman" },
    details: "Finalized contract terms and activated",
    version: "1.1",
  },
  {
    id: "hist_010",
    contract_id: "CONT-2023-001",
    timestamp: new Date(2023, 7, 15, 10, 30).toISOString(),
    action_type: "updated",
    user: { id: "user3", name: "Michael Levy" },
    details: "Extended contract validity period by 6 months",
    version: "1.5",
  }
];

// Extend the Contract entity with a getHistory method that returns mock data
export function extendContractWithHistory(Contract) {
  // Check if Contract exists and is an object
  if (!Contract || typeof Contract !== 'object') {
    console.warn("Cannot extend Contract with history methods - Contract is undefined or not an object");
    return;
  }
  
  // Add getHistory method if it doesn't exist
  if (!Contract.getHistory) {
    Contract.getHistory = async function(contractId = null) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter by contractId if provided
      if (contractId) {
        return mockContractHistory.filter(item => item.contract_id === contractId);
      }
      
      // Return all mock data
      return mockContractHistory;
    };
    
    console.log("Successfully extended Contract with history methods");
  }
}