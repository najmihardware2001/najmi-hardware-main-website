// Separate provenance for the original inventory and the client-approved additions.
const SYSTEMS = ['NAJMI_MASTER_46', 'NAJMI_CLIENT_APPROVAL_20261023'];
const isManaged = system => SYSTEMS.includes(system);
module.exports = { SYSTEMS, isManaged };
