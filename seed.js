// ============================================================================
// AirCargo World — demo data
// Five fictional companies per role, with cargo and charter requests, offers,
// contracts, shipments, flights, free capacity and notifications spread over
// the last ~10 days, so a first visit already looks like a running market.
// Times are offsets from "now"; on the local backend they slide forward on
// later visits so the demo always looks recent.
// ============================================================================

const Seed = (() => {
  const VERSION = 1;
  const MARKER = 'seed_u_co1';                      // this user doc carries seedVersion / seedAnchor
  const TIME_FIELDS = ['createdAt','tenderStartsAt','tenderEndsAt','awardedAt','lastAdvancedAt','paidAt','departAt','requiredDate'];
  const HOUR = 3600000, DAY = 24 * HOUR;

  // key: [role, company name, country, days since registration]
  const COMPANIES = {
    co1: ['cargo_owner', 'Samarkand Textile Group',     'Uzbekistan',  14],
    co2: ['cargo_owner', 'Andijan Auto Components',     'Uzbekistan',  13],
    co3: ['cargo_owner', 'Fergana Fresh Produce',       'Uzbekistan',  12],
    co4: ['cargo_owner', 'Rhein Medtech AG',            'Germany',     12],
    co5: ['cargo_owner', 'Brightline Electronics Ltd',  'China',       11],
    fw1: ['forwarder',   'Silkway Freight Partners',    'Uzbekistan',  14],
    fw2: ['forwarder',   'Meridian Air Logistics',      'UAE',         13],
    fw3: ['forwarder',   'Harborline Cargo Solutions',  'Hong Kong',   13],
    fw4: ['forwarder',   'Nordhafen Spedition GmbH',    'Germany',     12],
    fw5: ['forwarder',   'Anatolia Cargo Services',     'Turkiye',     11],
    al1: ['airline',     'Aral Sky Cargo',              'Uzbekistan',  14],
    al2: ['airline',     'Gulfwing Cargo',              'UAE',         13],
    al3: ['airline',     'Pacific Crest Cargo',         'Hong Kong',   13],
    al4: ['airline',     'Northbridge Air Freight',     'UK',          12],
    al5: ['airline',     'Steppe Wings Cargo',          'Kazakhstan',  11],
    br1: ['broker',      'Charterlink Brokers',         'UK',          13],
    br2: ['broker',      'AeroMatch Charter',           'Netherlands', 12],
    br3: ['broker',      'Orient Charter Partners',     'Singapore',   12],
    br4: ['broker',      'Caspian Air Brokers',         'Kazakhstan',  11],
    br5: ['broker',      'Polaris Charter Group',       'USA',         10],
  };

  const d = n => n * DAY, h = n => n * HOUR;

  // Offers: [company, price USD, transit days, service level, time offset, notes].
  // award.to is the index of the winning offer; stage is the tracking milestone (7 = completed).
  const CARGO = [
    { id:'cr01', owner:'co1', route:['TAS','FRA'], commodity:'Cotton yarn & knitted fabric', type:'GEN', hs:'5205.12',
      kg:2400, cbm:14, pcs:9, dim:'120×100×130 cm', terms:'FCA', temp:'Ambient', docs:['Commercial Invoice','Packing List','Export Declaration'],
      created:-d(9)-h(4), window:[-d(9)-h(4), -d(7)-h(4)],
      award:{ to:0, at:-d(7)-h(1), paidAt:-d(6)-h(20), stage:7, advancedAt:-d(2), rating:5 },
      offers:[ ['fw1', 7650, 4, 'Priority', -d(8)-h(20), 'Daily uplift via IST, export customs included.'],
               ['fw2', 8240, 3, 'Premium',  -d(8)-h(9),  'Direct freighter, guaranteed allocation.'],
               ['al1', 7180, 5, 'Standard', -d(8)-h(2),  'Main deck on our TAS–FRA rotation.'],
               ['fw5', 7420, 6, 'Standard', -d(7)-h(18), 'Consolidation via the IST hub.'] ] },
    { id:'cr02', owner:'co1', route:['TAS','MXP'], commodity:'Silk scarves & ikat garments', type:'GEN', hs:'6214.10',
      kg:650, cbm:4.2, pcs:30, dim:'60×40×58 cm', terms:'DAP', temp:'Ambient', docs:['Commercial Invoice','Packing List'],
      created:-d(1)-h(6), window:[-d(1)-h(6), d(2)],
      offers:[ ['fw1', 2390, 4, 'Standard', -h(20), 'Door delivery to the Milan showroom included.'],
               ['fw4', 2710, 3, 'Priority', -h(9),  'Via FRA with a road feeder to Milan.'] ] },

    { id:'cr03', owner:'co2', route:['ICN','TAS'], commodity:'Engine control units & sensors', type:'AUTO', hs:'8537.10',
      kg:1800, cbm:9, pcs:24, dim:'80×60×80 cm', terms:'FCA', temp:'Ambient', docs:['Commercial Invoice','Packing List','Certificate of Origin'],
      created:-d(6)-h(3), window:[-d(6)-h(3), -d(4)-h(3)],
      award:{ to:0, at:-d(4), paidAt:-d(3)-h(18), stage:3, advancedAt:-h(6) },
      offers:[ ['al1', 6900, 3, 'Priority', -d(5)-h(20), 'Weekly ICN–TAS freighter, cargo insurance available on request.'],
               ['fw3', 6450, 6, 'Standard', -d(5)-h(10), 'Via HKG consolidation.'],
               ['al3', 7400, 4, 'Premium',  -d(5),       'Dedicated ULDs and live tracking.'] ] },
    { id:'cr04', owner:'co2', route:['PVG','TAS'], commodity:'Gearbox assemblies', type:'AUTO', hs:'8708.40',
      kg:5200, cbm:22, pcs:12, dim:'150×120×100 cm', terms:'EXW', temp:'Ambient', docs:['Commercial Invoice','Packing List'],
      created:-d(2)-h(5), window:[-d(2)-h(5), -h(10)], closed:true,
      offers:[ ['fw3', 15900, 5, 'Standard', -d(1)-h(22), 'Pickup from the Shanghai plant (EXW), routed via HKG.'],
               ['al3', 17400, 3, 'Priority', -d(1)-h(15), 'Next PVG freighter, two PMC positions held.'],
               ['al1', 16650, 4, 'Priority', -d(1)-h(6),  'Via ICN on our own aircraft.'],
               ['fw1', 18900, 2, 'Premium',  -h(20),      'Door pickup, express clearance in TAS.'],
               ['br4', 17100, 4, 'Standard', -h(14),      'Part-charter slot on a PVG–ALA–TAS rotation.'] ] },

    { id:'cr05', owner:'co3', route:['TAS','DXB'], commodity:'Fresh herbs & leafy greens', type:'PER', hs:'0709.99',
      kg:3200, cbm:18, pcs:160, dim:'60×40×47 cm cartons', terms:'FCA', temp:'+2…+8 °C (chilled)', docs:['Commercial Invoice','Packing List','Certificate of Origin'],
      created:-d(4)-h(2), window:[-d(4)-h(2), -d(3)-h(2)],
      award:{ to:0, at:-d(3), paidAt:-d(2)-h(20), stage:5, advancedAt:-h(5) },
      offers:[ ['al2', 8900, 1, 'Priority', -d(3)-h(20), 'Overnight DXB freighter, cool chain +2…+8 °C.'],
               ['fw2', 8400, 2, 'Standard', -d(3)-h(14), 'Belly capacity, cool room at DXB.'],
               ['fw5', 9600, 1, 'Premium',  -d(3)-h(6),  'Thermal blankets and priority handling.'] ] },
    { id:'cr06', owner:'co3', route:['TAS','LHR'], commodity:'Pomegranates', type:'PER', hs:'0810.90',
      kg:2100, cbm:12, pcs:105, dim:'60×40×48 cm cartons', terms:'FCA', temp:'+2…+8 °C (chilled)', docs:['Commercial Invoice','Packing List'],
      created:-h(5), window:[-h(5), d(1)+h(3)],
      offers:[ ['fw2', 7300, 3, 'Standard', -h(2), 'Via DXB, cool chain throughout.'],
               ['fw5', 7900, 2, 'Priority', -h(1), 'Via IST with a next-day connection.'] ] },

    { id:'cr07', owner:'co4', route:['FRA','TAS'], commodity:'Diagnostic reagent kits (dry ice)', type:'PIL', hs:'3822.19', dgClasses:[9],
      kg:420, cbm:3.1, pcs:14, dim:'80×60×46 cm', terms:'CIP', temp:'−20 °C (frozen)', docs:['Commercial Invoice','Packing List','Export Declaration'],
      created:-d(3)-h(6), window:[-d(3)-h(6), -d(1)-h(6)],
      award:{ to:0, at:-d(1)-h(2), stage:0, advancedAt:-d(1)-h(2) },
      offers:[ ['fw4', 4350, 2, 'Premium',  -d(2)-h(20), 'GDP-certified, dry ice replenished at transfer.'],
               ['fw5', 3900, 3, 'Priority', -d(2)-h(8),  'Via IST with CEIV Pharma handling.'],
               ['al4', 4600, 2, 'Premium',  -d(1)-h(20), 'Active temperature-controlled container available.'] ] },
    { id:'cr08', owner:'co4', route:['FRA','ALA'], commodity:'Medical imaging equipment', type:'GEN', hs:'9022.14',
      kg:3800, cbm:28, pcs:6, dim:'240×180×110 cm', terms:'DAP', temp:'Ambient', docs:['Commercial Invoice','Packing List'],
      created:-h(2), window:[h(6), d(3)+h(6)], offers:[] },

    { id:'cr09', owner:'co5', route:['HKG','TAS'], commodity:'Smartphones & accessories (Li-ion)', type:'VAL', hs:'8517.13', dgClasses:[9],
      kg:1500, cbm:8, pcs:60, dim:'60×40×55 cm', terms:'DDP', temp:'Ambient', docs:['Commercial Invoice','Packing List'],
      created:-d(2)-h(2), window:[-d(2)-h(2), h(6)],
      offers:[ ['fw2', 6250, 4, 'Standard', -d(1)-h(20), 'Via DXB, secure escort at destination.'],
               ['fw3', 5980, 5, 'Standard', -d(1)-h(10), 'Consolidated, high-value cage.'],
               ['al3', 6900, 2, 'Priority', -d(1),       'Direct flight, VAL handling and secure storage.'],
               ['br3', 7400, 2, 'Premium',  -h(6),       'Dedicated ULD on a partner freighter.'] ] },
    { id:'cr10', owner:'co5', route:['HKG','ALA'], commodity:'LED display panels', type:'GEN', hs:'8528.59',
      kg:2600, cbm:16, pcs:40, dim:'200×20×100 cm', terms:'FCA', temp:'Ambient', docs:['Commercial Invoice','Packing List'],
      created:-d(8)-h(5), window:[-d(8)-h(5), -d(6)-h(5)],
      award:{ to:0, at:-d(6)-h(2), paidAt:-d(5)-h(20), stage:7, advancedAt:-d(1)-h(8), rating:4 },
      offers:[ ['fw3', 8100, 4, 'Priority', -d(7)-h(22), 'Weekly HKG–ALA consolidation.'],
               ['al5', 8600, 3, 'Priority', -d(7)-h(12), 'Our ALA freighter, unloading at our own hub.'],
               ['al3', 7700, 5, 'Standard', -d(7)-h(3),  'Via PVG connection.'],
               ['fw2', 9200, 3, 'Premium',  -d(6)-h(18), 'Via DXB with door delivery.'] ] },

    // Commercial cargo requests published by forwarders
    { id:'cr11', owner:'fw1', route:['TAS','IST'], commodity:'Consolidated garments & ceramics', type:'GEN', hs:'6109.10',
      kg:4100, cbm:25, pcs:18, dim:'120×80×145 cm', terms:'FCA', temp:'Ambient', docs:['Commercial Invoice','Packing List'],
      created:-h(20), window:[-h(20), d(2)],
      offers:[ ['al1', 9800, 2, 'Priority', -h(14), 'Weekly TAS–IST rotation, three PMC positions.'],
               ['al5', 9100, 3, 'Standard', -h(6),  'Via an ALA connection.'] ] },
    { id:'cr12', owner:'fw2', route:['DXB','NBO'], commodity:'Automotive spare parts (consolidation)', type:'AUTO', hs:'8708.99',
      kg:2200, cbm:13, pcs:34, dim:'80×60×80 cm', terms:'FCA', temp:'Ambient', docs:['Commercial Invoice','Packing List'],
      created:-d(3), window:[-d(3), -d(1)], closed:true,
      offers:[ ['al2', 5400, 1, 'Priority', -d(2)-h(18), 'Daily DXB–NBO, same-day uplift.'],
               ['al4', 6100, 2, 'Premium',  -d(2)-h(6),  'Guaranteed space, priority recovery.'],
               ['br1', 4900, 3, 'Standard', -d(1)-h(20), 'Part-charter on a weekly ACMI rotation.'] ] },
    { id:'cr13', owner:'fw4', route:['FRA','TAS'], commodity:'AOG: landing gear actuator', type:'AOG', hs:'8803.20',
      kg:380, cbm:1.3, pcs:2, dim:'180×60×60 cm', terms:'DAP', temp:'Ambient', docs:['Commercial Invoice'],
      created:-d(1)-h(4), window:[-d(1)-h(4), -h(22)],
      award:{ to:0, at:-h(21), paidAt:-h(20), stage:2, advancedAt:-h(8) },
      offers:[ ['al1', 3900, 1, 'Premium', -d(1)-h(1), 'Tonight’s TAS rotation, AOG desk 24/7.'],
               ['al4', 4400, 1, 'Premium', -h(23),      'Via LHR, on-board courier option.'] ] },
    { id:'cr14', owner:'fw5', route:['IST','TAS'], commodity:'Laboratory chemicals (flammable, corrosive)', type:'DGR', hs:'3824.99', dgClasses:[3,8],
      kg:640, cbm:2.9, pcs:20, dim:'60×40×60 cm', terms:'FCA', temp:'Ambient', docs:['Commercial Invoice','Packing List'],
      created:-h(3), window:[-h(3), d(3)], offers:[] },
    { id:'cr15', owner:'fw3', route:['HKG','FRA'], commodity:'E-commerce parcels (410 parcels on 25 pallets)', type:'OTHER', typeOther:'E-commerce parcels', hs:'',
      kg:6800, cbm:48, pcs:25, dim:'120×100×160 cm pallets', terms:'FCA', temp:'Ambient', docs:['Commercial Invoice'],
      created:-d(1)-h(12), window:[-d(1)-h(12), d(2)],
      offers:[ ['al3', 19800, 2, 'Standard', -d(1)-h(2), 'Tue/Thu/Sat HKG–FRA 747-8F, built-up pallets accepted.'],
               ['al4', 21400, 3, 'Priority', -h(10),      'Via LHR with trucking to FRA.'] ] },
  ];

  const CHARTER = [
    { id:'ch01', owner:'co2', route:['PVG','TAS'], cargo:'Production line equipment — full freighter', kg:38000,
      date:5, freq:'One-off', aircraft:'Wide-body freighter', payload:'Heaviest piece 12 t, max height 2.9 m',
      created:-d(1)-h(8),
      offers:[ ['br1', 218000, 2, 'Priority', -d(1),  'B747-400F, ACMI partner, slot confirmed.'],
               ['br4', 205000, 3, 'Standard', -h(16), 'Il-76TD, outsize door, ground handling arranged.'],
               ['al3', 236000, 1, 'Premium',  -h(7),  'Own B747-8F, nose-door loading.'],
               ['br2', 211000, 2, 'Standard', -h(3),  'B777F, one fuel stop in ALA.'] ] },
    { id:'ch02', owner:'fw1', route:['TAS','DXB'], cargo:'Fresh produce programme — weekly rotation', kg:22000,
      date:9, freq:'Weekly', aircraft:'Narrow-body freighter', payload:'Cool chain +2…+8 °C, 6 rotations',
      created:-d(2),
      offers:[ ['al2', 58000, 1, 'Priority', -d(1)-h(12), 'Price per rotation, B757-200F.'],
               ['br3', 54500, 1, 'Standard', -h(20),      'Price per rotation, partner B737-800BCF.'] ] },
    { id:'ch03', owner:'co4', route:['FRA','ALA'], cargo:'Hospital equipment — urgent', kg:18000,
      date:-2, freq:'One-off', aircraft:'Any suitable aircraft', payload:'Oversize MRI magnet crate, 2.6 m high',
      created:-d(7),
      award:{ to:0, at:-d(5)-h(12), paidAt:-d(5), stage:4, advancedAt:-d(1) },
      offers:[ ['br2', 128000, 2, 'Priority', -d(6)-h(12), 'B747-400F with main-deck loading, departure within 48 h.'],
               ['al4', 142000, 2, 'Premium',  -d(6)-h(6),  'Own B747-400F with main-deck loading.'],
               ['br5', 119000, 3, 'Standard', -d(6),       'Il-76TD via a technical stop.'] ] },
    { id:'ch04', owner:'fw2', route:['DXB','LOS'], cargo:'Telecom tower equipment', kg:41000,
      date:4, freq:'One-off', aircraft:'Wide-body freighter', payload:'Pieces up to 8 m long',
      created:-d(3)-h(4), closed:true,
      offers:[ ['br1', 214000, 2, 'Priority', -d(2)-h(20), 'B747-400F, nose door for long pieces.'],
               ['br5', 199000, 3, 'Standard', -d(2)-h(6),  'MD-11F, one stop in CAI.'],
               ['al2', 226000, 1, 'Premium',  -d(1)-h(18), 'Own B777F, non-stop.'] ] },
    { id:'ch05', owner:'co5', route:['HKG','JFK'], cargo:'Consumer electronics — peak season', kg:95000,
      date:12, freq:'Monthly', aircraft:'Main-deck cargo', payload:'Li-ion batteries packed with equipment (UN3481)',
      created:-d(1)-h(2),
      offers:[ ['br5', 468000, 2, 'Standard', -h(20), 'B747-8F, monthly block of four flights.'],
               ['al3', 495000, 1, 'Priority', -h(11), 'Own B747-8F, priority slots at JFK.'],
               ['br3', 482000, 2, 'Priority', -h(4),  'B777F with a one-hour turnaround in ANC.'] ] },
  ];

  // Airline flights and free capacity. depart: [days from today, 'HH:MM'] for one-off departures.
  const CAPACITY = [
    { id:'cap01', owner:'al1', kind:'flight', type:'regular', no:'ARL 301', route:['TAS','FRA'], days:[1,3,5], time:'08:30',
      aircraft:'Boeing 767-300F', kg:18000, cbm:110, height:243, temps:['Ambient','+2…+8 °C (chilled)','+15…+25 °C (CRT)'],
      notes:'Main deck and lower deck. DG accepted except Class 1 and 7.', created:-d(6) },
    { id:'cap02', owner:'al1', kind:'space', no:'ARL 305', route:['TAS','ICN'], depart:[3,'14:00'],
      aircraft:'Boeing 767-300F', kg:6500, cbm:38, height:243, rate:2.10, temps:['Ambient','+2…+8 °C (chilled)'],
      notes:'Six PMC positions left.', created:-d(1)-h(9) },
    { id:'cap03', owner:'al2', kind:'flight', type:'charter', no:'GWC 220', route:['DXB','NBO'], depart:[6,'22:00'],
      aircraft:'Boeing 777F', kg:95000, cbm:600, height:300, temps:['Ambient','+2…+8 °C (chilled)'],
      notes:'Empty leg — available for the full aircraft or part-charter.', created:-d(2)-h(4) },
    { id:'cap04', owner:'al2', kind:'space', no:'GWC 461', route:['DXB','TAS'], depart:[2,'03:15'],
      aircraft:'Passenger aircraft (belly hold)', kg:4200, cbm:25, height:160, rate:1.85, temps:['Ambient'],
      notes:'Lower-deck only, pieces up to 160 cm high.', created:-h(18) },
    { id:'cap05', owner:'al3', kind:'flight', type:'regular', no:'PCC 818', route:['HKG','FRA'], days:[2,4,6], time:'23:45',
      aircraft:'Boeing 747-8F', kg:30000, cbm:180, height:300, temps:['Ambient','+2…+8 °C (chilled)','+15…+25 °C (CRT)','−20 °C (frozen)'],
      notes:'Nose-door loading available for long pieces.', created:-d(5)-h(6) },
    { id:'cap06', owner:'al3', kind:'space', no:'PCC 652', route:['HKG','ALA'], depart:[4,'09:00'],
      aircraft:'Airbus A330-200F', kg:9000, cbm:55, height:244, rate:2.65, temps:['Ambient','+15…+25 °C (CRT)'],
      notes:'', created:-d(1)-h(2) },
    { id:'cap07', owner:'al4', kind:'flight', type:'charter', no:'NBF 107', route:['LHR','JFK'], depart:[8,'11:00'],
      aircraft:'Boeing 747-400F', kg:100000, cbm:650, height:300, temps:['Ambient'],
      notes:'Full-aircraft charter, ACMI or wet lease.', created:-d(3) },
    { id:'cap08', owner:'al4', kind:'space', no:'NBF 233', route:['LHR','TAS'], depart:[5,'18:30'],
      aircraft:'Airbus A330-300P2F', kg:3000, cbm:18, height:160, rate:2.95, temps:['Ambient','+2…+8 °C (chilled)'],
      notes:'AOG and pharma priority boarding.', created:-h(30) },
    { id:'cap09', owner:'al5', kind:'flight', type:'regular', no:'SWC 455', route:['ALA','IST'], days:[1,4], time:'06:10',
      aircraft:'Boeing 757-200F', kg:12000, cbm:80, height:213, temps:['Ambient','+2…+8 °C (chilled)'],
      notes:'', created:-d(4)-h(8) },
    { id:'cap10', owner:'al5', kind:'flight', type:'charter', no:'SWC 990', route:['ALA','PVG'], depart:[7,'07:00'],
      aircraft:'Ilyushin Il-76TD', kg:38000, cbm:180, height:340, temps:['Ambient'],
      notes:'Outsize and heavy-lift cargo welcome; rear ramp loading.', created:-d(2)-h(10) },
  ];

  // Capacity requests sent to airlines: [from, listing, kg, comment, time offset].
  const CAP_REQUESTS = [
    ['fw1', 'cap02', 800,  'Garments, 10 pallets',                     -d(1)-h(3)],
    ['co2', 'cap10', 9500, 'Return load for our equipment programme',  -d(1)-h(10)],
    ['fw2', 'cap04', 1500, '',                                         -h(9)],
    ['co5', 'cap06', 1200, 'LED panels, pieces 2.0 m long',            -h(5)],
    ['fw4', 'cap08', 450,  'AOG spares, need priority',                -h(2)],
  ];

  // Builds every seed document with timestamps relative to `base` (a whole hour).
  function build(base){
    const at = off => base + off;
    const dayAt = (days, hhmm) => { const t = new Date(base + d(days)); const [hh, mm] = hhmm.split(':').map(Number); t.setHours(hh, mm, 0, 0); return t.getTime(); };
    const uid = key => 'seed_u_' + key;
    const name = key => COMPANIES[key][1];
    const route = r => `${r[0]} → ${r[1]}`;
    const out = { users:[], cargoRequests:[], charterRequests:[], offers:[], capacity:[], notifications:[] };
    const notes = [];
    const note = (key, msgKey, params, off) => notes.push({ userId: uid(key), key: msgKey, params, createdAt: at(off) });

    Object.entries(COMPANIES).forEach(([key, [role, companyName, country, days]]) => {
      const slug = companyName.toLowerCase().replace(/[^a-z]+/g, '');
      out.users.push({ id: uid(key), role, companyName, country, email: `ops@${slug}.example`, seed: true, createdAt: at(-d(days)) });
      note(key, 'n.welcome', {}, -d(days));
    });
    // The marker goes last so a half-finished write to a shared database is retried on the next visit.
    const markerIdx = out.users.findIndex(u => u.id === MARKER);
    out.users.push({ ...out.users.splice(markerIdx, 1)[0], seedVersion: VERSION, seedAnchor: base });

    // Shared by cargo and charter requests: offers, award state and their notifications.
    const addOffers = (spec, requestType, doc) => {
      const ids = spec.offers.map(([provider, price, transitDays, serviceLevel, off, notesText], i) => {
        const id = `seed_of_${spec.id}_${i}`;
        out.offers.push({ id, requestId: doc.id, requestType, providerId: uid(provider), providerName: name(provider),
          providerRole: COMPANIES[provider][0], price, currency:'USD', transitDays, serviceLevel, notes: notesText, createdAt: at(off) });
        note(spec.owner, requestType==='cargo' ? 'n.offerCargo' : 'n.offerCharter', { company: name(provider), route: route(spec.route) }, off);
        return id;
      });
      if (spec.award){
        const a = spec.award;
        Object.assign(doc, { status:'awarded', awardedOfferId: ids[a.to], awardedAt: at(a.at), trackingStage: a.stage, lastAdvancedAt: at(a.advancedAt) });
        if (a.paidAt !== undefined) Object.assign(doc, { paymentStatus:'paid', paidAt: at(a.paidAt) });
        if (a.rating) doc.rating = a.rating;
        note(spec.offers[a.to][0], requestType==='cargo' ? 'n.awardCargo' : 'n.awardCharter', { route: route(spec.route) }, a.at);
      }
      return doc;
    };

    CARGO.forEach(s => {
      out.cargoRequests.push(addOffers(s, 'cargo', {
        id: 'seed_' + s.id, ownerId: uid(s.owner), ownerName: name(s.owner), origin: s.route[0], destination: s.route[1],
        commodity: s.commodity, cargoType: s.type, cargoTypeOther: s.typeOther || '', hsCode: s.hs,
        weightKg: s.kg, volumeCbm: s.cbm, pieces: s.pcs, dimensions: s.dim, tempReq: s.temp,
        dg: s.dgClasses ? 'DG' : 'Non-DG', dgClasses: s.dgClasses || [],
        service: s.terms, documents: s.docs, tenderStartsAt: at(s.window[0]), tenderEndsAt: at(s.window[1]),
        status: s.closed ? 'closed' : 'open', createdAt: at(s.created),
      }));
    });

    CHARTER.forEach(s => {
      out.charterRequests.push(addOffers(s, 'charter', {
        id: 'seed_' + s.id, ownerId: uid(s.owner), ownerName: name(s.owner), origin: s.route[0], destination: s.route[1],
        cargoDesc: s.cargo, weightKg: s.kg, requiredDate: dayAt(s.date, '12:00'), frequency: s.freq,
        aircraftType: s.aircraft, payloadReq: s.payload, status: s.closed ? 'closed' : 'open', createdAt: at(s.created),
      }));
    });

    CAPACITY.forEach(s => {
      const regular = s.type === 'regular';
      out.capacity.push({
        id: 'seed_' + s.id, kind: s.kind, ownerId: uid(s.owner), ownerName: name(s.owner),
        flightType: s.kind === 'flight' ? s.type : null, flightNo: s.no, flightId: s.flight ? 'seed_' + s.flight : null,
        origin: s.route[0], destination: s.route[1],
        departAt: regular ? null : dayAt(s.depart[0], s.depart[1]), days: regular ? s.days : [], departTime: regular ? s.time : '',
        aircraft: s.aircraft, capacityKg: s.kg, capacityCbm: s.cbm, maxHeightCm: s.height, temps: s.temps,
        ratePerKg: s.rate || 0, notes: s.notes, status: 'active', createdAt: at(s.created),
      });
    });

    CAP_REQUESTS.forEach(([from, capId, kg, comment, off]) => {
      const cap = CAPACITY.find(c => c.id === capId);
      note(cap.owner, comment ? 'n.capRequestNote' : 'n.capRequest', { company: name(from), kg, route: route(cap.route), note: comment }, off);
    });

    // Anything older than half a day has been read already.
    out.notifications = notes.sort((a, b) => a.createdAt - b.createdAt)
      .map((n, i) => ({ id: `seed_n_${String(i).padStart(3, '0')}`, ...n, read: n.createdAt < base - h(12) }));
    return out;
  }

  // Called once at boot, before the first render.
  async function ensure(){
    const now = Date.now();
    const local = Store.backend === 'local';
    const marker = await Store.get('users', MARKER);
    const anchorAge = now - ((marker && marker.seedAnchor) || now);
    // A shared database can't slide rows safely, so it gets a fresh seed once a day instead.
    if (!marker || marker.seedVersion !== VERSION || (!local && anchorAge >= DAY)){
      const seed = build(Math.floor(now / HOUR) * HOUR);
      const rest = ['cargoRequests','charterRequests','offers','capacity','notifications'];
      if (local){ for (const c of [...rest, 'users']) await Store.putSeed(c, seed[c]); return; }
      // db: companies first so the login page fills quickly; the marker last so an interrupted write is redone.
      (async () => {
        await Store.putSeed('users', seed.users.filter(u => u.id !== MARKER));
        for (const c of rest) await Store.putSeed(c, seed[c]);
        await Store.putSeed('users', seed.users.filter(u => u.id === MARKER));
      })().catch(() => {});
      return;
    }
    // Local demo: slide timestamps forward in whole hours so the data keeps looking recent.
    const delta = Math.floor(anchorAge / HOUR) * HOUR;
    if (!local || delta < HOUR) return;
    const isSeed = v => String(v || '').startsWith('seed_');
    const PAST = ['createdAt','awardedAt','paidAt','lastAdvancedAt'];      // things that already happened stay in the past
    COLLECTIONS.forEach(c => Store.mapLocal(c, doc => {
      // The visitor's own offers on demo requests and notifications to demo companies move with them (times only).
      const linked = (c === 'offers' && isSeed(doc.requestId)) || (c === 'notifications' && isSeed(doc.userId));
      if (!isSeed(doc.id) && !linked) return doc;
      const next = { ...doc };
      (isSeed(doc.id) ? TIME_FIELDS : ['createdAt']).forEach(f => { if (typeof next[f] === 'number') next[f] += delta; });
      PAST.forEach(f => { if (typeof next[f] === 'number') next[f] = Math.min(next[f], now); });
      if (next.id === MARKER) next.seedAnchor = marker.seedAnchor + delta;
      return next;
    }));
  }

  return { ensure, build, VERSION, MARKER };
})();
