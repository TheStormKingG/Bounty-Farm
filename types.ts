// Using string literals for Date for simplicity in forms, will be converted to Timestamp on save
export type DateString = string; 

export enum Role {
  Admin = 'Admin',
  HatcheryClerk = 'HatcheryClerk',
  SalesClerk = 'SalesClerk',
}

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  name: string;
}

// Settings-related types
export interface Supplier {
  id: string;
  name: string;
  status: 'Approved' | 'Provisional';
}

export interface Breed {
  id: string;
  name: string;
}

export interface Vaccine {
  id: string;
  name: string;
  type: 'Injection' | 'Spray';
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  type: 'Regular' | 'New';
}


export interface EggProcurement {
  id: string;
  supplierId: string;
  flockId?: string;
  breed?: string;
  cases: number;
  eggsPerCase: number;
  totalEggs: number;
  deliveryAt: DateString;
  condition: string;
  transportIssues?: string;
  orderRef?: string;
  deliveryReceiptUrl?: string;
  nonConformance: boolean;
  remarks?: string;
  createdBy: string;
  createdAt: string; 
}

export enum HatchColourCode {
    BLUE = '1-BLUE',
    ORANGE = '2-ORANGE',
    GREEN = '3-GREEN',
    WHITE = '4-WHITE',
    YELLOW = '5-YELLOW',
    RED = '6-RED',
}

export interface HatchCycle {
  id: string;
  hatchNo: string;
  colourCode?: HatchColourCode;

  // Egg Reception
  flocksRecd?: string[];
  casesRecd?: number;
  eggsRecd?: number;
  avgEggWgt?: number; // in grams
  eggsCracked?: number;

  // Setting Details
  eggsSet: number;
  datePacked?: DateString;
  setDate: DateString;

  // Candling
  dateCandled?: DateString;
  candling: {
    clears?: number;
    earlyDead?: number;
  };

  // Hatch Expectation
  expHatchQty?: number;
  pctAdj?: number;
  expHatchQtyAdj?: number;
  
  // Hatch Outcome
  hatchDate?: DateString; // Date Hatched
  avgChicksWgt?: number; // in grams
  outcome: {
    hatched?: number; // Chicks Hatched
    culled?: number;  // Chicks Culled
  };
  vaccinationProfile?: string;
  chicksSold?: number;

  status: 'OPEN' | 'CLOSED';
  createdBy: string;
  createdAt: string;
}


export interface ChickProcessing {
  id: string;
  hatchNo: string;
  sortDate: DateString;
  gradeA: number;
  cull: number;
  cullReasons?: Record<string, number>;
  cullDisposal?: 'Maceration' | 'Compost' | 'Rendering' | 'Incineration';
  vaccinesGiven?: string[];
  vaccineBatches?: Record<string, string>;
  boxesPrepared: number;
  chicksPerBox: number;
  finalCountConfirmed: number;
  createdBy: string;
  createdAt: string;
}

export interface Trip {
  tripId: string;
  quantity: number;
  dispatchedAt: DateString;
}

export interface Order {
  id: string;
  customer: string;
  type: 'Standing' | 'AdHoc';
  quantityOrdered: number;
  hatchDate: DateString;
  location: 'Hatchery' | 'Outlet' | 'Delivery';
  status: 'Pending' | 'Confirmed' | 'Allocated' | 'Completed' | 'NoShow' | 'Cancelled';
  paymentStatus?: 'Pending' | 'Paid' | 'Partial';
  allocatedQty?: number;
  dispatchId?: string;
  trips?: Trip[];
  flockIds?: string[];
  createdBy: string;
  createdAt: string;
}

export interface NonViableEgg {
  id: string;
  hatchNo?: string;
  detectionPoint: 'Receiving' | 'Candling' | 'Transfer' | 'Hatch';
  date: DateString;
  flockId?: string;
  infertile?: number;
  earlyDead?: number;
  midDead?: number;
  lateDead?: number;
  leaker?: number;
  rotten?: number;
  contaminated?: number;
  total: number;
  disposedBy: 'Maceration' | 'Compost' | 'Rendering' | 'Incineration' | 'Hold';
  dispatched: boolean;
  createdBy: string;
  createdAt: string;
}