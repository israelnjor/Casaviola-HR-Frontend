export const getAdmin = () => {
  try {
    return JSON.parse(localStorage.getItem('casaviola_admin') || '{}');
  } catch {
    return {};
  }
};

export const getRole = () => getAdmin().role || '';

export const isCEO = () => getRole() === 'CEO';
export const isGM = () => getRole() === 'GM';
export const isAdminOps = () => getRole() === 'Admin';
export const isFinance = () => getRole() === 'Finance';
export const isPropertyListings = () => getRole() === 'Property Listings';
export const isEstateManager = () => getRole() === 'Estate Manager';
export const isCustomerService = () => getRole() === 'Customer Service';

// Permission groups
export const canFullAccess = () => ['CEO', 'GM'].includes(getRole());
export const canManageStaff = () => ['CEO', 'GM', 'Admin'].includes(getRole());
export const canManagePayroll = () => ['CEO', 'GM', 'Finance'].includes(getRole());
export const canViewPayroll = () => ['CEO', 'GM', 'Admin', 'Finance'].includes(getRole());
export const canManageAttendance = () => ['CEO', 'GM', 'Admin'].includes(getRole());
export const canAssignTasks = () => ['CEO', 'GM', 'Admin'].includes(getRole());
export const canManageInventory = () => ['CEO', 'GM', 'Admin', 'Estate Manager'].includes(getRole());
export const canCreateLogins = () => ['CEO', 'GM', 'Admin'].includes(getRole());