{
  [
    "New Request",
    "In Progress",
    "OM Escalated",
    "Waiting 3PL",
    "Closed",
    "Canceled By User",
    "Re-Opened",
    "Waiting Buyer/Supplier",
    "Waiting Customer",
    "Waiting Elevator Repair",
    "Waiting on IT",
    "Waiting Tool Move",
    "Exceptions / Variants",
    "Waiting Chemicals",
    "Waiting Count/Verify",
    "Waiting Delivery Confirmation",
    "Waiting Distribution",
    "Waiting ePart",
    "Waiting Inbound",
    "Waiting IMO",
    "Waiting Inv Control",
    "Waiting Put-away",
    "Waiting Returns",
    "Waiting Shipping",
    "Waiting Si",
    "Waiting Stores",
  ].map((priority) => (
    <option key={priority} value={priority}>
      {priority}
    </option>
  ));
}
