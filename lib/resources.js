import dayjs from 'dayjs';
import { avg, max, sum, countDistinct, countWhere } from './format';

import * as projects from '@/services/projects';
import * as prospects from '@/services/prospects';
import * as grids from '@/services/grids';
import * as collars from '@/services/collars';
import * as rabCollars from '@/services/rab-collars';
import * as mws from '@/services/mw-s';
import * as drillSurveys from '@/services/drill-surveys';
import * as coreSizes from '@/services/core-sizes';
import * as perAreaHoles from '@/services/per-area-holes';
import * as pits from '@/services/pits';
import * as drills from '@/services/drills';
import * as samples from '@/services/samples';
import * as composites from '@/services/composites';
import * as composAu from '@/services/compos-au';
import * as lithology from '@/services/lithology';
import * as stdReferences from '@/services/std-references';
import * as dispatches from '@/services/dispatches';
import * as differences from '@/services/differences';
import * as invoices from '@/services/invoices';
import * as branches from '@/services/branches';
import * as users from '@/services/users';
import * as roles from '@/services/roles';
import * as permissions from '@/services/permissions';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import * as elements from '@/services/elements';
import * as colours from '@/services/colours';
import * as rocks from '@/services/rocks';
import * as qualifiers from '@/services/qualifiers';
import * as schistosity from '@/services/schistosity';
import * as sizes from '@/services/sizes';
import * as weathering from '@/services/weathering';

/*
 * One entry per backend module. Field names, types and validation mirror the
 * Spring Boot request records (modules/<name>/payload/*Requests.java).
 *
 * Field types: text | textarea | integer | decimal | date | boolean | select | relation | multirelation | password
 * Column formats: text | number | date | money | chip | bool | relation | status
 */

// ── Field helpers ───────────────────────────────────────────
const text    = (name, label, o = {}) => ({ name, label, type: 'text', maxLength: 255, ...o });
const area    = (name, label, o = {}) => ({ name, label, type: 'textarea', span: 'full', ...o });
const int     = (name, label, o = {}) => ({ name, label, type: 'integer', ...o });
const dec     = (name, label, o = {}) => ({ name, label, type: 'decimal', ...o });
const date    = (name, label, o = {}) => ({ name, label, type: 'date', ...o });
const bool    = (name, label, o = {}) => ({ name, label, type: 'boolean', ...o });
const choice  = (name, label, options, o = {}) => ({ name, label, type: 'select', options, ...o });
const rel     = (name, label, ref, o = {}) => ({ name, label, type: 'relation', ref, ...o });
const multi   = (name, label, ref, o = {}) => ({ name, label, type: 'multirelation', ref, span: 'full', ...o });
const secret  = (name, label, o = {}) => ({ name, label, type: 'password', ...o });

const REQ   = { required: true };
const ORDER = int('orderNumber', 'Order number', { required: true, min: 0 });
const DEPTH = { min: 0, suffix: 'm' };
const DEG   = { min: 0, max: 360, suffix: '°' };
const PCT   = { min: 0, max: 100, suffix: '%' };
const PAST  = { pastOrPresent: true };
const today = () => dayjs().format('YYYY-MM-DD');

// ── Cross-field rules (mirror the checks in the backend services) ──
// Each rule gets the parsed payload and returns { field: message } or null.
const greaterThan = (to, from, message) => (v) =>
    v[to] !== null && v[from] !== null && v[to] <= v[from] ? { [to]: message } : null;
const DEPTH_ORDER = greaterThan('toDepth', 'fromDepth', 'To must be greater than From');
const ASSAYED_LTE_SAMPLES = (v) =>
    v.numberAssayed !== null && v.numberOfSamples !== null && v.numberAssayed > v.numberOfSamples
        ? { numberAssayed: 'Cannot be greater than the number of samples' } : null;
const RECEIVED_AFTER_DISPATCH = (v) =>
    v.dispatchDate && v.dateReceived && v.dateReceived < v.dispatchDate
        ? { dateReceived: 'Cannot be before the dispatch date' } : null;
const notLessThan = (max, min, message) => (v) =>
    v[max] !== null && v[min] !== null && v[max] < v[min] ? { [max]: message } : null;
const atLeastOne = (fields, message) => (v) =>
    fields.every(f => v[f] === null) ? { [fields[0]]: message } : null;

// ── Column helpers ──────────────────────────────────────────
const col = (key, label, format = 'text', o = {}) => ({ key, label, format, ...o });

// ── Stat helpers (tile tones: teal | green | red | amber | blue | purple) ──
const total = (label, icon) => (rows) => ({ label, value: rows.length, icon, tone: 'teal' });

const toOptions = (values) => values.map(v => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }));

const crud = (svc, plural, singular) => ({
    list:   svc[`get${plural}`],
    get:    svc[`get${singular}ById`],
    create: svc[`create${singular}`],
    update: svc[`update${singular}`],
    remove: svc[`delete${singular}`],
});

// Adds derived fields to every row the service returns (list and get).
const withRows = (service, fn) => ({
    ...service,
    list: async () => (await service.list()).map(fn),
    get:  async (id) => fn(await service.get(id)),
});

// ── User management helpers ─────────────────────────────────
const fullName = (r) => [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ');
const PHONE = { regex: /^\+?[0-9]{7,15}$/, message: 'Enter 7–15 digits, optionally starting with +' };
const USER_STATUS = {
    ACTIVE:    { label: 'Active',    tone: 'green' },
    INACTIVE:  { label: 'Inactive',  tone: 'amber' },
    SUSPENDED: { label: 'Suspended', tone: 'red' },
};
// Permission names are <MODULE>_<ACTION>, e.g. RAB_COLLAR_VIEW.
const permissionParts = (name) => {
    const m = /^(.+)_(VIEW|CREATE|UPDATE|DELETE)$/.exec(name || '');
    return m ? { module: m[1], action: m[2] } : { module: name, action: '' };
};
const humanize = (key) => key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ');
const permissionModule = (name) => {
    const { module } = permissionParts(name);
    return RESOURCE_LIST.find(r => permissionKey(r.slug) === module)?.title ?? humanize(module);
};

const LIST = [
    // ════════════════ EXPLORATION ════════════════
    {
        slug: 'projects', title: 'Projects', singular: 'Project', icon: 'fa-folder-open', group: 'exploration',
        service: crud(projects, 'Projects', 'Project'),
        label: r => r.name,
        primary: { key: 'name', sub: 'tenement' },
        columns: [col('tenement', 'Tenement'), col('costCode', 'Cost code', 'chip')],
        filter: { key: 'tenement', label: 'tenements' },
        stats: [
            total('Total projects', 'fa-folder-open'),
            rows => ({ label: 'Tenements', value: countDistinct(rows, 'tenement'), icon: 'fa-map', tone: 'blue' }),
            rows => ({ label: 'Cost codes', value: countDistinct(rows, 'costCode'), icon: 'fa-hashtag', tone: 'amber' }),
        ],
        sections: [{
            title: 'Project details', icon: 'fa-folder-open',
            fields: [text('name', 'Project name', { ...REQ, placeholder: 'e.g. Mawemeru' }), text('tenement', 'Tenement', REQ), text('costCode', 'Cost code', REQ)],
        }],
    },
    {
        slug: 'prospects', title: 'Prospects', singular: 'Prospect', icon: 'fa-map-location-dot', group: 'exploration',
        service: crud(prospects, 'Prospects', 'Prospect'),
        label: r => r.name,
        primary: { key: 'name', sub: 'localName' },
        columns: [col('localName', 'Local name'), col('minX', 'Min X', 'number'), col('minY', 'Min Y', 'number'), col('maxX', 'Max X', 'number'), col('maxY', 'Max Y', 'number')],
        stats: [
            total('Total prospects', 'fa-map-location-dot'),
            rows => ({ label: 'Local names', value: countDistinct(rows, 'localName'), icon: 'fa-signature', tone: 'blue' }),
        ],
        sections: [{
            title: 'Prospect details', icon: 'fa-map-location-dot',
            fields: [text('name', 'Name', REQ), text('localName', 'Local name'), dec('minX', 'Min X'), dec('minY', 'Min Y'), dec('maxX', 'Max X'), dec('maxY', 'Max Y')],
        }],
        rules: [notLessThan('maxX', 'minX', 'Max X cannot be less than Min X'), notLessThan('maxY', 'minY', 'Max Y cannot be less than Min Y')],
    },
    {
        slug: 'grids', title: 'Grids', singular: 'Grid', icon: 'fa-border-all', group: 'exploration',
        service: crud(grids, 'Grids', 'Grid'),
        label: r => r.localName,
        primary: { key: 'localName', sub: 'datum' },
        columns: [col('zone', 'Zone', 'chip'), col('datum', 'Datum'), col('originalGrid', 'Original grid'), col('derivedGrid', 'Derived grid'), col('delta', 'Delta', 'number')],
        filter: { key: 'zone', label: 'zones' },
        stats: [
            total('Total grids', 'fa-border-all'),
            rows => ({ label: 'Zones', value: countDistinct(rows, 'zone'), icon: 'fa-globe', tone: 'blue' }),
            rows => ({ label: 'Datums', value: countDistinct(rows, 'datum'), icon: 'fa-ruler-combined', tone: 'amber' }),
        ],
        sections: [
            { title: 'Grid', icon: 'fa-border-all', fields: [text('localName', 'Local name', REQ), text('zone', 'Zone'), text('datum', 'Datum'), text('originalGrid', 'Original grid'), text('derivedGrid', 'Derived grid'), dec('delta', 'Delta')] },
            { title: 'Original control points', icon: 'fa-location-dot', fields: [dec('e1o', 'E1o'), dec('n1o', 'N1o'), dec('e2o', 'E2o'), dec('n2o', 'N2o')] },
        ],
    },
    {
        slug: 'pits', title: 'Pits', singular: 'Pit', icon: 'fa-person-digging', group: 'exploration',
        service: crud(pits, 'Pits', 'Pit'),
        rules: [DEPTH_ORDER],
        label: r => r.pitNumber,
        order: 'orderNumber',
        primary: { key: 'pitNumber', sub: 'studyType' },
        columns: [col('fromDepth', 'From (m)', 'number'), col('toDepth', 'To (m)', 'number'), col('auAvg', 'Au avg', 'number'), col('auPpb', 'Au (ppb)', 'number'), col('laboratory', 'Laboratory', 'chip')],
        filter: { key: 'pitNumber', label: 'pits' },
        stats: [
            total('Total pit samples', 'fa-person-digging'),
            rows => ({ label: 'Pits', value: countDistinct(rows, 'pitNumber'), icon: 'fa-hashtag', tone: 'blue' }),
            rows => ({ label: 'Average Au', value: avg(rows, 'auAvg'), icon: 'fa-coins', tone: 'amber' }),
            rows => ({ label: 'Laboratories', value: countDistinct(rows, 'laboratory'), icon: 'fa-flask', tone: 'purple' }),
        ],
        sections: [
            { title: 'Pit', icon: 'fa-person-digging', fields: [ORDER, text('pitNumber', 'Pit number', REQ), text('studyType', 'Study type'), dec('fromDepth', 'From', { ...REQ, ...DEPTH }), dec('toDepth', 'To', { ...REQ, ...DEPTH }), text('fraction', 'Fraction')] },
            { title: 'Coordinates', icon: 'fa-location-crosshairs', fields: [dec('localE', 'Local E'), dec('localN', 'Local N'), dec('utmE', 'UTM East'), dec('utmN', 'UTM North'), dec('rlM', 'RL', { suffix: 'm' })] },
            { title: 'Assays', icon: 'fa-flask', fields: [rel('lithologyId', 'Lithology', 'lithology'), rel('sampleId', 'Sample', 'samples'), text('laboratory', 'Laboratory'), dec('auAvg', 'Au avg'), dec('auPpb', 'Au (ppb)'), dec('auRpt1', 'Au repeat 1'), dec('auRpt2', 'Au repeat 2'), area('comments', 'Comments')] },
        ],
    },

    // ════════════════ DRILLING ════════════════
    {
        slug: 'collars', title: 'Collars', singular: 'Collar', icon: 'fa-location-crosshairs', group: 'drilling',
        service: crud(collars, 'Collars', 'Collar'),
        label: r => r.hole,
        primary: { key: 'hole' },
        columns: [col('utmE', 'UTM E', 'number'), col('utmN', 'UTM N', 'number'), col('zone', 'Zone', 'chip'), col('rl', 'RL', 'number'), col('azimuth', 'Azimuth', 'number'), col('hdepth', 'Depth (m)', 'number'), col('dateDrilled', 'Drilled', 'date')],
        stats: [
            total('Total collars', 'fa-location-crosshairs'),
            rows => ({ label: 'Tenements', value: countDistinct(rows, 'tenement'), icon: 'fa-map', tone: 'purple' }),
            rows => ({ label: 'Metres drilled', value: sum(rows, 'hdepth'), icon: 'fa-ruler-vertical', tone: 'amber' }),
        ],
        sections: [
            { title: 'Hole', icon: 'fa-bore-hole', fields: [rel('mwsId', 'Hole', 'mw-s', REQ), dec('hdepth', 'Hole depth', DEPTH), date('dateDrilled', 'Date drilled', { ...PAST, default: today })] },
            { title: 'Coordinates & orientation', icon: 'fa-location-crosshairs', fields: [dec('utmE', 'UTM East'), dec('utmN', 'UTM North'), text('zone', 'Zone'), dec('localX', 'Local X'), dec('localY', 'Local Y'), text('localName', 'Local grid name'), dec('rl', 'RL', { suffix: 'm' }), dec('azimuth', 'Azimuth', DEG), dec('utmAz', 'UTM azimuth', DEG)] },
            { title: 'Tenure & maps', icon: 'fa-map', fields: [text('tenement', 'Tenement'), text('claim', 'Claim'), text('map125', 'Map 1:125k'), text('map50', 'Map 1:50k'), text('localMapSheet', 'Local map sheet')] },
        ],
    },
    {
        slug: 'rab-collars', title: 'RAB Collars', singular: 'RAB Collar', icon: 'fa-crosshairs', group: 'drilling',
        service: crud(rabCollars, 'RabCollars', 'RabCollar'),
        label: r => r.hole,
        primary: { key: 'hole', sub: 'type' },
        columns: [col('utmE', 'UTM E', 'number'), col('utmN', 'UTM N', 'number'), col('hdepth', 'Depth (m)', 'number')],
        filter: { key: 'type', label: 'hole types' },
        stats: [
            total('Total RAB collars', 'fa-crosshairs'),
            rows => ({ label: 'Hole types', value: countDistinct(rows, 'type'), icon: 'fa-shapes', tone: 'blue' }),
            rows => ({ label: 'Metres drilled', value: sum(rows, 'hdepth'), icon: 'fa-ruler-vertical', tone: 'amber' }),
        ],
        sections: [{ title: 'RAB collar', icon: 'fa-crosshairs', fields: [rel('mwsId', 'Hole', 'mw-s', REQ), choice('type', 'Type', ['RAB', 'RC', 'DDH', 'AIRCORE'].map(v => ({ value: v, label: v }))), dec('utmE', 'UTM East'), dec('utmN', 'UTM North'), dec('hdepth', 'Hole depth', DEPTH)] }],
    },
    {
        slug: 'mw-s', title: 'MW-S Holes', singular: 'MW-S Hole', icon: 'fa-circle-dot', group: 'drilling',
        service: crud(mws, 'MwsHoles', 'MwsHole'),
        label: r => r.hole,
        primary: { key: 'hole', sub: 'type' },
        columns: [col('type', 'Type', 'chip'), col('hdepth', 'Depth (m)', 'number')],
        filter: { key: 'type', label: 'types' },
        stats: [
            total('Total holes', 'fa-circle-dot'),
            rows => ({ label: 'Types', value: countDistinct(rows, 'type'), icon: 'fa-shapes', tone: 'blue' }),
            rows => ({ label: 'Metres drilled', value: sum(rows, 'hdepth'), icon: 'fa-ruler-vertical', tone: 'amber' }),
        ],
        sections: [{ title: 'Hole', icon: 'fa-circle-dot', fields: [text('hole', 'Hole', REQ), text('type', 'Type', REQ), dec('hdepth', 'Hole depth', { ...REQ, ...DEPTH })] }],
    },
    {
        slug: 'drill-surveys', title: 'Drill Surveys', singular: 'Drill Survey', icon: 'fa-compass', group: 'drilling',
        service: crud(drillSurveys, 'DrillSurveys', 'DrillSurvey'),
        label: r => `${r.hole} @ ${r.downdepth}m`,
        primary: { key: 'hole' },
        columns: [col('downdepth', 'Down depth (m)', 'number'), col('dip', 'Dip (°)', 'number'), col('azimuth', 'Azimuth (°)', 'number'), col('utmAz', 'UTM Az (°)', 'number')],
        filter: { key: 'hole', label: 'holes' },
        stats: [
            total('Total survey points', 'fa-compass'),
            rows => ({ label: 'Holes surveyed', value: countDistinct(rows, 'hole'), icon: 'fa-bore-hole', tone: 'blue' }),
            rows => ({ label: 'Deepest reading (m)', value: max(rows, 'downdepth'), icon: 'fa-arrow-down-long', tone: 'amber' }),
        ],
        sections: [{ title: 'Survey reading', icon: 'fa-compass', fields: [rel('mwsId', 'Hole', 'mw-s', REQ), dec('downdepth', 'Down depth', { ...REQ, ...DEPTH }), dec('dip', 'Dip', { ...REQ, min: -90, max: 90, suffix: '°' }), dec('azimuth', 'Azimuth', { ...REQ, ...DEG }), dec('utmAz', 'UTM azimuth', { ...REQ, ...DEG })] }],
    },
    {
        slug: 'core-sizes', title: 'Core Sizes', singular: 'Core Size', icon: 'fa-ruler-vertical', group: 'drilling',
        service: crud(coreSizes, 'CoreSizes', 'CoreSize'),
        rules: [greaterThan('coreTo', 'coreFrom', 'Core to must be greater than core from')],
        label: r => `${r.hole} · ${r.coreSize}`,
        primary: { key: 'hole', sub: 'preCollarMethod' },
        columns: [col('preCollarTo', 'Pre-collar to (m)', 'number'), col('coreFrom', 'Core from (m)', 'number'), col('coreTo', 'Core to (m)', 'number'), col('coreSize', 'Core size', 'chip')],
        filter: { key: 'coreSize', label: 'core sizes' },
        stats: [
            total('Total records', 'fa-ruler-vertical'),
            rows => ({ label: 'Holes', value: countDistinct(rows, 'hole'), icon: 'fa-bore-hole', tone: 'blue' }),
            rows => ({ label: 'Core sizes', value: countDistinct(rows, 'coreSize'), icon: 'fa-circle-half-stroke', tone: 'amber' }),
        ],
        sections: [{ title: 'Core size', icon: 'fa-ruler-vertical', fields: [rel('mwsId', 'Hole', 'mw-s', REQ), dec('preCollarTo', 'Pre-collar to', DEPTH), text('preCollarMethod', 'Pre-collar method'), dec('coreFrom', 'Core from', { ...REQ, ...DEPTH }), dec('coreTo', 'Core to', { ...REQ, ...DEPTH }), text('coreSize', 'Core size', REQ)] }],
    },
    {
        slug: 'per-area-holes', title: 'Holes per Area', singular: 'Area Hole Record', icon: 'fa-chart-area', group: 'drilling',
        service: crud(perAreaHoles, 'PerAreaHoles', 'PerAreaHole'),
        rules: [atLeastOne(['buhDiamond', 'buhRab', 'buhRc', 'kilamoDiamond', 'kilamoRab', 'kilamoRc', 'nyaseDdh', 'nyaseRab', 'nyaseRc'], 'Enter at least one hole')],
        label: r => [r.buhDiamond, r.kilamoDiamond, r.nyaseDdh].filter(Boolean).join(' / ') || 'Record',
        columns: [col('buhDiamond', 'Buh. DDH'), col('buhRab', 'Buh. RAB'), col('buhRc', 'Buh. RC'), col('kilamoDiamond', 'Kil. DDH'), col('kilamoRab', 'Kil. RAB'), col('kilamoRc', 'Kil. RC'), col('nyaseRab', 'Nya. RAB'), col('nyaseRc', 'Nya. RC'), col('nyaseDdh', 'Nya. DDH')],
        stats: [total('Total records', 'fa-chart-area')],
        sections: [
            { title: 'Buhemba', icon: 'fa-location-dot', fields: [text('buhDiamond', 'Diamond'), text('buhRab', 'RAB'), text('buhRc', 'RC')] },
            { title: 'Kilamo', icon: 'fa-location-dot', fields: [text('kilamoDiamond', 'Diamond'), text('kilamoRab', 'RAB'), text('kilamoRc', 'RC')] },
            { title: 'Nyase', icon: 'fa-location-dot', fields: [text('nyaseDdh', 'Diamond (DDH)'), text('nyaseRab', 'RAB'), text('nyaseRc', 'RC')] },
        ],
    },

    // ════════════════ SAMPLING & ASSAYS ════════════════
    {
        slug: 'drills', title: 'Drill Assays', singular: 'Drill Assay', icon: 'fa-bore-hole', group: 'assays',
        service: crud(drills, 'Drills', 'Drill'),
        rules: [DEPTH_ORDER],
        label: r => r.sample,
        order: 'orderNumber',
        primary: { key: 'sample', sub: 'hole' },
        columns: [col('fromDepth', 'From (m)', 'number'), col('toDepth', 'To (m)', 'number'), col('au', 'Au', 'number'), col('recoveryPercent', 'Recovery %', 'number'), col('elementId', 'Element', 'relation', { ref: 'elements' }), col('wetDry', 'Moisture', 'chip')],
        status: r => r.exclude ? { label: 'Excluded', tone: 'red' } : { label: 'Included', tone: 'green' },
        filter: { key: 'hole', label: 'holes' },
        stats: [
            total('Total intervals', 'fa-bore-hole'),
            rows => ({ label: 'Holes', value: countDistinct(rows, 'hole'), icon: 'fa-location-crosshairs', tone: 'blue' }),
            rows => ({ label: 'Average Au', value: avg(rows, 'au'), icon: 'fa-coins', tone: 'amber' }),
            rows => ({ label: 'Excluded', value: countWhere(rows, r => r.exclude), icon: 'fa-ban', tone: 'red' }),
        ],
        sections: [
            { title: 'Interval', icon: 'fa-bore-hole', fields: [ORDER, rel('mwsId', 'Hole', 'mw-s', REQ), text('sample', 'Sample', REQ), dec('fromDepth', 'From', { ...REQ, ...DEPTH }), dec('toDepth', 'To', { ...REQ, ...DEPTH }), rel('elementId', 'Element', 'elements', REQ)] },
            { title: 'Sampling', icon: 'fa-vial', fields: [choice('riffleGrab', 'Sample method', toOptions(['RIFFLE', 'GRAB'])), choice('wetDry', 'Moisture', toOptions(['WET', 'DRY'])), dec('recoveryPercent', 'Recovery', PCT), text('flag', 'Flag'), text('flagId', 'Flag ID'), bool('exclude', 'Exclude from analysis')] },
            { title: 'Assay results', icon: 'fa-flask', fields: [dec('au', 'Au'), dec('auRp1', 'Au repeat 1'), dec('auRp2', 'Au repeat 2'), dec('auRp3', 'Au repeat 3'), dec('auRp4', 'Au repeat 4'), dec('au2', 'Au 2'), dec('au2Rp1', 'Au 2 repeat 1'), dec('au2Plot', 'Au 2 plot'), area('comments', 'Comments')] },
        ],
    },
    {
        slug: 'samples', title: 'Samples', singular: 'Sample', icon: 'fa-vial', group: 'assays',
        service: crud(samples, 'Samples', 'Sample'),
        label: r => r.sample,
        order: 'orderNumber',
        primary: { key: 'sample', sub: 'description' },
        columns: [col('code', 'Code', 'chip'), col('utmE', 'UTM E', 'number'), col('utmN', 'UTM N', 'number'), col('au', 'Au', 'number'), col('elementId', 'Element', 'relation', { ref: 'elements' }), col('tenement', 'Tenement')],
        filter: { key: 'tenement', label: 'tenements' },
        stats: [
            total('Total samples', 'fa-vial'),
            rows => ({ label: 'Average Au', value: avg(rows, 'au'), icon: 'fa-coins', tone: 'amber' }),
            rows => ({ label: 'Highest Au', value: max(rows, 'au'), icon: 'fa-arrow-trend-up', tone: 'green' }),
            rows => ({ label: 'Tenements', value: countDistinct(rows, 'tenement'), icon: 'fa-map', tone: 'blue' }),
        ],
        sections: [
            { title: 'Sample', icon: 'fa-vial', fields: [ORDER, text('sample', 'Sample', REQ), text('code', 'Code'), rel('elementId', 'Element', 'elements'), text('flag', 'Flag'), text('flagId', 'Flag ID'), text('description', 'Description', { span: 2 })] },
            { title: 'Location', icon: 'fa-location-crosshairs', fields: [dec('utmE', 'UTM East'), dec('utmN', 'UTM North'), text('zone', 'Zone'), dec('localX', 'Local X'), dec('localY', 'Local Y'), text('localName', 'Local grid name'), text('tenement', 'Tenement'), text('claim', 'Claim'), text('map125', 'Map 1:125k'), text('map50', 'Map 1:50k')] },
            { title: 'Assay results', icon: 'fa-flask', fields: [dec('au', 'Au'), dec('auRp1', 'Au repeat 1'), dec('auRp2', 'Au repeat 2'), dec('au2', 'Au 2'), area('comments', 'Comments')] },
        ],
    },
    {
        slug: 'composites', title: 'Composites', singular: 'Composite', icon: 'fa-layer-group', group: 'assays',
        service: crud(composites, 'Composites', 'Composite'),
        rules: [DEPTH_ORDER],
        label: r => `${r.hole} ${r.fromDepth}–${r.toDepth}m`,
        primary: { key: 'hole' },
        columns: [col('fromDepth', 'From (m)', 'number'), col('toDepth', 'To (m)', 'number'), col('length', 'Length (m)', 'number'), col('averageNi', 'Avg Ni', 'number'), col('averageCo', 'Avg Co', 'number')],
        filter: { key: 'hole', label: 'holes' },
        stats: [
            total('Total composites', 'fa-layer-group'),
            rows => ({ label: 'Holes', value: countDistinct(rows, 'hole'), icon: 'fa-bore-hole', tone: 'blue' }),
            rows => ({ label: 'Average Ni', value: avg(rows, 'averageNi'), icon: 'fa-atom', tone: 'green' }),
            rows => ({ label: 'Average Co', value: avg(rows, 'averageCo'), icon: 'fa-atom', tone: 'purple' }),
        ],
        sections: [{ title: 'Composite interval', icon: 'fa-layer-group', fields: [rel('mwsId', 'Hole', 'mw-s', REQ), dec('fromDepth', 'From', { ...REQ, ...DEPTH }), dec('toDepth', 'To', { ...REQ, ...DEPTH }), dec('averageNi', 'Average Ni', { min: 0 }), dec('averageCo', 'Average Co', { min: 0 })] }],
    },
    {
        slug: 'compos-au', title: 'Au Composites', singular: 'Au Composite', icon: 'fa-coins', group: 'assays',
        service: crud(composAu, 'AuComposites', 'AuComposite'),
        rules: [DEPTH_ORDER],
        label: r => r.sample,
        primary: { key: 'sample', sub: 'hole' },
        columns: [col('fromDepth', 'From (m)', 'number'), col('toDepth', 'To (m)', 'number'), col('length', 'Length (m)', 'number'), col('au', 'Au', 'number'), col('flag', 'Flag', 'chip')],
        status: r => r.exclude ? { label: 'Excluded', tone: 'red' } : { label: 'Included', tone: 'green' },
        filter: { key: 'hole', label: 'holes' },
        stats: [
            total('Total composites', 'fa-coins'),
            rows => ({ label: 'Holes', value: countDistinct(rows, 'hole'), icon: 'fa-bore-hole', tone: 'blue' }),
            rows => ({ label: 'Average Au', value: avg(rows, 'au'), icon: 'fa-coins', tone: 'amber' }),
            rows => ({ label: 'Excluded', value: countWhere(rows, r => r.exclude), icon: 'fa-ban', tone: 'red' }),
        ],
        sections: [{ title: 'Au composite', icon: 'fa-coins', fields: [rel('mwsId', 'Hole', 'mw-s', REQ), text('sample', 'Sample', REQ), dec('fromDepth', 'From', { ...REQ, ...DEPTH }), dec('toDepth', 'To', { ...REQ, ...DEPTH }), dec('au', 'Au'), text('flag', 'Flag'), bool('exclude', 'Exclude from analysis')] }],
    },
    {
        slug: 'lithology', title: 'Lithology', singular: 'Lithology Interval', icon: 'fa-mountain', group: 'assays',
        service: crud(lithology, 'Lithologies', 'Lithology'),
        rules: [greaterThan('lithto', 'lithfrom', 'To must be greater than From')],
        label: r => `${r.hole} · ${r.lithcode} (${r.lithfrom}–${r.lithto}m)`,
        primary: { key: 'hole', sub: 'lithcode' },
        columns: [col('lithfrom', 'From (m)', 'number'), col('lithto', 'To (m)', 'number'), col('quartzPercent', 'Quartz %', 'number'), col('pyritesPercent', 'Pyrite %', 'number'), col('colour', 'Colour', 'chip'), col('weathcodeId', 'Weathering', 'relation', { ref: 'weathering' })],
        filter: { key: 'hole', label: 'holes' },
        stats: [
            total('Total intervals', 'fa-mountain'),
            rows => ({ label: 'Holes', value: countDistinct(rows, 'hole'), icon: 'fa-bore-hole', tone: 'blue' }),
            rows => ({ label: 'Lith codes', value: countDistinct(rows, 'lithcode'), icon: 'fa-gem', tone: 'purple' }),
            rows => ({ label: 'Average quartz %', value: avg(rows, 'quartzPercent'), icon: 'fa-percent', tone: 'amber' }),
        ],
        sections: [
            { title: 'Interval', icon: 'fa-mountain', fields: [rel('mwsId', 'Hole', 'mw-s', REQ), dec('lithfrom', 'From', { ...REQ, ...DEPTH }), dec('lithto', 'To', { ...REQ, ...DEPTH }), text('lithcode', 'Lith code', REQ), rel('weathcodeId', 'Weathering', 'weathering')] },
            { title: 'Description', icon: 'fa-gem', fields: [dec('quartzPercent', 'Quartz', PCT), dec('pyritesPercent', 'Pyrites', PCT), text('alteration', 'Alteration'), text('schistosity', 'Schistosity'), text('grainsize', 'Grain size'), text('colour', 'Colour'), area('comments', 'Comments')] },
        ],
    },
    {
        slug: 'std-references', title: 'Standards', singular: 'Standard', icon: 'fa-flask', group: 'assays',
        service: crud(stdReferences, 'StdReferences', 'StdReference'),
        label: r => r.standard,
        primary: { key: 'standard', sub: 'elementsUnit' },
        columns: [col('refAu', 'Ref Au', 'number'), col('auUnits', 'Units', 'chip'), col('n', 'N', 'number'), col('refAuArAas', 'Ref Au AR-AAS', 'number'), col('refAuFa50', 'Ref Au FA50', 'number')],
        filter: { key: 'auUnits', label: 'units' },
        stats: [
            total('Total standards', 'fa-flask'),
            rows => ({ label: 'Average ref Au', value: avg(rows, 'refAu'), icon: 'fa-coins', tone: 'amber' }),
        ],
        sections: [{ title: 'Reference standard', icon: 'fa-flask', fields: [text('standard', 'Standard', REQ), dec('refAu', 'Ref Au', { min: 0 }), text('auUnits', 'Au units'), int('n', 'N', { min: 0 }), dec('refAuArAas', 'Ref Au (AR-AAS)', { min: 0 }), text('auArUnits', 'Au AR units'), dec('refAuFa50', 'Ref Au (FA50)', { min: 0 }), text('elementsUnit', 'Elements unit')] }],
    },

    // ════════════════ LAB & FINANCE ════════════════
    {
        slug: 'dispatches', title: 'Dispatches', singular: 'Dispatch', icon: 'fa-truck-fast', group: 'lab',
        service: crud(dispatches, 'Dispatches', 'Dispatch'),
        rules: [ASSAYED_LTE_SAMPLES, RECEIVED_AFTER_DISPATCH],
        label: r => `#${r.orderNumber} ${r.batch || ''}`.trim(),
        order: 'orderNumber',
        primary: { key: 'sampleNoRange', sub: 'originator' },
        columns: [col('projectId', 'Project', 'relation', { ref: 'projects' }), col('lab', 'Lab', 'chip'), col('batch', 'Batch'), col('dispatchDate', 'Dispatched', 'date'), col('numberOfSamples', 'Samples', 'number'), col('dateReceived', 'Received', 'date')],
        status: r => r.dateReceived ? { label: 'Received', tone: 'green' } : { label: 'In transit', tone: 'amber' },
        filter: { key: 'lab', label: 'labs' },
        stats: [
            total('Total dispatches', 'fa-truck-fast'),
            rows => ({ label: 'Samples dispatched', value: sum(rows, 'numberOfSamples'), icon: 'fa-vial', tone: 'blue' }),
            rows => ({ label: 'Samples assayed', value: sum(rows, 'numberAssayed'), icon: 'fa-flask', tone: 'green' }),
            rows => ({ label: 'In transit', value: countWhere(rows, r => !r.dateReceived), icon: 'fa-hourglass-half', tone: 'amber' }),
        ],
        sections: [
            { title: 'Dispatch', icon: 'fa-truck-fast', fields: [ORDER, rel('projectId', 'Project', 'projects'), text('type', 'Type'), text('sampleNoRange', 'Sample no. range'), text('originator', 'Originator'), text('gridHoles', 'Grid / holes')] },
            { title: 'Laboratory', icon: 'fa-flask', fields: [text('preLab', 'Prep lab'), text('lab', 'Lab'), text('labLoc', 'Lab location'), text('batch', 'Batch'), int('numberOfSamples', 'No. of samples', { min: 0 }), int('numberAssayed', 'No. assayed', { min: 0 })] },
            { title: 'Dates & billing', icon: 'fa-calendar-days', fields: [date('dispatchDate', 'Dispatch date'), date('dateReceived', 'Date received'), rel('invoiceId', 'Invoice', 'invoices')] },
        ],
    },
    {
        slug: 'differences', title: 'Differences', singular: 'Difference', icon: 'fa-code-compare', group: 'lab',
        service: crud(differences, 'Differences', 'Difference'),
        rules: [ASSAYED_LTE_SAMPLES, RECEIVED_AFTER_DISPATCH],
        label: r => `#${r.orderNumber} ${r.batch || ''}`.trim(),
        order: 'orderNumber',
        primary: { key: 'sampleNoRange', sub: 'type' },
        columns: [col('projectId', 'Project', 'relation', { ref: 'projects' }), col('lab', 'Lab', 'chip'), col('batch', 'Batch'), col('dispatchDate', 'Dispatched', 'date'), col('numberOfSamples', 'Samples', 'number'), col('numberAssayed', 'Assayed', 'number')],
        filter: { key: 'lab', label: 'labs' },
        stats: [
            total('Total records', 'fa-code-compare'),
            rows => ({ label: 'Samples', value: sum(rows, 'numberOfSamples'), icon: 'fa-vial', tone: 'blue' }),
            rows => ({ label: 'Assayed', value: sum(rows, 'numberAssayed'), icon: 'fa-flask', tone: 'green' }),
            rows => ({ label: 'Not yet assayed', value: sum(rows, 'numberOfSamples') - sum(rows, 'numberAssayed'), icon: 'fa-hourglass-half', tone: 'amber' }),
        ],
        sections: [
            { title: 'Difference', icon: 'fa-code-compare', fields: [ORDER, rel('projectId', 'Project', 'projects'), text('type', 'Type'), text('sampleNoRange', 'Sample no. range')] },
            { title: 'Laboratory', icon: 'fa-flask', fields: [text('preLab', 'Prep lab'), text('lab', 'Lab'), text('labLoc', 'Lab location'), text('batch', 'Batch'), int('numberOfSamples', 'No. of samples', { min: 0 }), int('numberAssayed', 'No. assayed', { min: 0 })] },
            { title: 'Dates & billing', icon: 'fa-calendar-days', fields: [date('dispatchDate', 'Dispatch date'), date('dateReceived', 'Date received'), rel('invoiceId', 'Invoice', 'invoices')] },
        ],
    },
    {
        slug: 'invoices', title: 'Invoices', singular: 'Invoice', icon: 'fa-file-invoice-dollar', group: 'lab',
        service: crud(invoices, 'Invoices', 'Invoice'),
        label: r => r.invoiceNumber,
        order: 'orderNumber',
        primary: { key: 'invoiceNumber', sub: 'labName' },
        columns: [col('analysis', 'Analysis'), col('jobNumber', 'Job no.', 'chip'), col('amountInUs', 'Amount', 'money'), col('accountCode', 'Account'), col('invoiceDate', 'Invoice date', 'date')],
        status: r => r.dateApproved ? { label: 'Approved', tone: 'green' } : { label: 'Pending', tone: 'amber' },
        filter: { key: 'labName', label: 'labs' },
        stats: [
            total('Total invoices', 'fa-file-invoice-dollar'),
            rows => ({ label: 'Total amount (USD)', value: sum(rows, 'amountInUs'), icon: 'fa-sack-dollar', tone: 'blue', format: 'money' }),
            rows => ({ label: 'Approved', value: countWhere(rows, r => r.dateApproved), icon: 'fa-circle-check', tone: 'green' }),
            rows => ({ label: 'Pending approval', value: countWhere(rows, r => !r.dateApproved), icon: 'fa-hourglass-half', tone: 'amber' }),
        ],
        sections: [
            { title: 'Invoice', icon: 'fa-file-invoice-dollar', fields: [ORDER, text('invoiceNumber', 'Invoice number', REQ), text('labName', 'Lab name'), text('analysis', 'Analysis'), text('jobNumber', 'Job number'), text('accountCode', 'Account code')] },
            { title: 'Amount & dates', icon: 'fa-sack-dollar', fields: [dec('amountInUs', 'Amount', { min: 0, prefix: 'USD' }), date('invoiceDate', 'Invoice date'), date('dateApproved', 'Date approved')] },
        ],
    },

    // ════════════════ LOOKUPS ════════════════
    {
        slug: 'branches', title: 'Branches', singular: 'Branch', icon: 'fa-code-branch', group: 'admin',
        service: crud(branches, 'Branches', 'Branch'),
        label: r => r.name,
        primary: { key: 'name' },
        columns: [],
        stats: [total('Total branches', 'fa-code-branch')],
        sections: [{ title: 'Branch', icon: 'fa-code-branch', fields: [text('name', 'Name', { ...REQ, span: 'full' })] }],
    },
    {
        slug: 'users', title: 'Users', singular: 'User', icon: 'fa-users', group: 'admin',
        service: withRows(crud(users, 'Users', 'User'), r => ({
            ...r, fullName: fullName(r), roles: [...(r.roleNames || [])].sort().join(', '),
        })),
        label: r => fullName(r) || r.username,
        primary: { key: 'username', sub: 'fullName' },
        columns: [col('phone', 'Phone'), col('branchName', 'Branch'), col('roles', 'Roles')],
        status: r => USER_STATUS[r.status] ?? { label: r.status || '—', tone: 'teal' },
        filter: { key: 'branchName', label: 'branches' },
        stats: [
            total('Total users', 'fa-users'),
            rows => ({ label: 'Active', value: countWhere(rows, r => r.status === 'ACTIVE'), icon: 'fa-user-check', tone: 'green' }),
            rows => ({ label: 'Inactive / suspended', value: countWhere(rows, r => r.status && r.status !== 'ACTIVE'), icon: 'fa-user-slash', tone: 'amber' }),
            rows => ({ label: 'Branches', value: countDistinct(rows, 'branchName'), icon: 'fa-code-branch', tone: 'blue' }),
        ],
        sections: [
            { title: 'Personal details', icon: 'fa-id-card', fields: [text('firstName', 'First name', { ...REQ, maxLength: 100 }), text('middleName', 'Middle name', { maxLength: 100 }), text('lastName', 'Last name', { ...REQ, maxLength: 100 }), text('phone', 'Phone', { ...REQ, pattern: PHONE, icon: 'fa-solid fa-phone', placeholder: '+255…' })] },
            { title: 'Account', icon: 'fa-user-lock', fields: [text('username', 'Username', { ...REQ, minLength: 3, maxLength: 100, icon: 'fa-solid fa-at' }), secret('password', 'Password', { ...REQ, minLength: 8, createOnly: true }), rel('branchId', 'Branch', 'branches', REQ), multi('roleIds', 'Roles', 'roles')] },
        ],
        rowActions: [{ label: 'Reset password', icon: 'fa-key', permission: 'edit', Modal: ChangePasswordModal }],
        detailExclude: ['branchName', 'roleNames', 'roles', 'fullName'],
    },
    {
        slug: 'roles', title: 'Roles', singular: 'Role', icon: 'fa-user-shield', group: 'admin',
        service: withRows(crud(roles, 'Roles', 'Role'), r => ({
            ...r, permissionIds: (r.permissions || []).map(p => p.id), permissionCount: (r.permissions || []).length,
        })),
        lookup: () => roles.getRoles({ activeOnly: true }),   // deactivated roles can't be newly assigned
        label: r => r.name,
        primary: { key: 'name', sub: 'description' },
        columns: [col('permissionCount', 'Permissions', 'number')],
        status: r => r.active ? { label: 'Active', tone: 'green' } : { label: 'Inactive', tone: 'amber' },
        stats: [
            total('Total roles', 'fa-user-shield'),
            rows => ({ label: 'Active', value: countWhere(rows, r => r.active), icon: 'fa-circle-check', tone: 'green' }),
            rows => ({ label: 'Inactive', value: countWhere(rows, r => !r.active), icon: 'fa-circle-pause', tone: 'amber' }),
        ],
        sections: [
            { title: 'Role', icon: 'fa-user-shield', fields: [text('name', 'Name', { ...REQ, maxLength: 100 }), bool('active', 'Active', { default: true }), area('description', 'Description')] },
            { title: 'Permissions', icon: 'fa-key', fields: [multi('permissionIds', 'Permissions', 'permissions', {
                groupBy: o => permissionModule(o.label),
                itemLabel: o => humanize(permissionParts(o.label).action || o.label),
            })] },
        ],
        detailExclude: ['permissions'],
    },
    {
        slug: 'permissions', title: 'Permissions', singular: 'Permission', icon: 'fa-key', group: 'admin',
        service: withRows(crud(permissions, 'Permissions', 'Permission'), r => ({
            ...r, module: permissionModule(r.name), action: permissionParts(r.name).action,
        })),
        label: r => r.name,
        primary: { key: 'name' },
        columns: [col('module', 'Module'), col('action', 'Action', 'chip')],
        filter: { key: 'module', label: 'modules' },
        stats: [
            total('Total permissions', 'fa-key'),
            rows => ({ label: 'Modules', value: countDistinct(rows, 'module'), icon: 'fa-cubes', tone: 'blue' }),
        ],
        sections: [{ title: 'Permission', icon: 'fa-key', fields: [text('name', 'Name', { ...REQ, maxLength: 100, span: 'full', placeholder: 'e.g. COLLAR_VIEW' })] }],
    },
    {
        slug: 'elements', title: 'Elements', singular: 'Element', icon: 'fa-atom', group: 'lookups',
        service: crud(elements, 'Elements', 'Element'),
        label: r => `${r.elementName} (${r.symbol})`,
        primary: { key: 'elementName', sub: 'symbol' },
        columns: [col('symbol', 'Symbol', 'chip')],
        stats: [total('Total elements', 'fa-atom')],
        sections: [{ title: 'Element', icon: 'fa-atom', fields: [text('elementName', 'Element name', { ...REQ, placeholder: 'e.g. Gold' }), text('symbol', 'Symbol', { ...REQ, placeholder: 'e.g. Au' })] }],
    },
    {
        slug: 'colours', title: 'Colours', singular: 'Colour', icon: 'fa-palette', group: 'lookups',
        service: crud(colours, 'Colours', 'Colour'),
        label: r => r.colourName,
        primary: { key: 'colourName', sub: 'colourCode' },
        columns: [col('colourCode', 'Code', 'chip')],
        stats: [total('Total colours', 'fa-palette')],
        sections: [{ title: 'Colour', icon: 'fa-palette', fields: [text('colourCode', 'Colour code', REQ), text('colourName', 'Colour name', REQ)] }],
    },
    {
        slug: 'rocks', title: 'Rocks', singular: 'Rock', icon: 'fa-gem', group: 'lookups',
        service: crud(rocks, 'Rocks', 'Rock'),
        label: r => r.rockCode,
        primary: { key: 'rockCode', sub: 'description' },
        columns: [col('regime', 'Regime', 'chip')],
        filter: { key: 'regime', label: 'regimes' },
        stats: [
            total('Total rock codes', 'fa-gem'),
            rows => ({ label: 'Regimes', value: countDistinct(rows, 'regime'), icon: 'fa-layer-group', tone: 'blue' }),
        ],
        sections: [{ title: 'Rock', icon: 'fa-gem', fields: [text('rockCode', 'Rock code', REQ), text('regime', 'Regime', REQ), area('description', 'Description')] }],
    },
    {
        slug: 'qualifiers', title: 'Qualifiers', singular: 'Qualifier', icon: 'fa-tags', group: 'lookups',
        service: crud(qualifiers, 'Qualifiers', 'Qualifier'),
        label: r => r.qualifierCode,
        primary: { key: 'qualifierCode', sub: 'description' },
        columns: [],
        stats: [total('Total qualifiers', 'fa-tags')],
        sections: [{ title: 'Qualifier', icon: 'fa-tags', fields: [text('qualifierCode', 'Qualifier code', REQ), area('description', 'Description')] }],
    },
    {
        slug: 'schistosity', title: 'Schistosity', singular: 'Schistosity', icon: 'fa-bars-staggered', group: 'lookups',
        service: crud(schistosity, 'Schistosities', 'Schistosity'),
        label: r => r.code,
        primary: { key: 'code', sub: 'schistosity' },
        columns: [col('schistosity', 'Schistosity')],
        stats: [total('Total codes', 'fa-bars-staggered')],
        sections: [{ title: 'Schistosity', icon: 'fa-bars-staggered', fields: [text('code', 'Code', REQ), text('schistosity', 'Schistosity', REQ)] }],
    },
    {
        slug: 'sizes', title: 'Grain Sizes', singular: 'Grain Size', icon: 'fa-arrows-left-right-to-line', group: 'lookups',
        service: crud(sizes, 'Sizes', 'Size'),
        label: r => r.code,
        primary: { key: 'code', sub: 'grain' },
        columns: [col('grain', 'Grain')],
        stats: [total('Total sizes', 'fa-arrows-left-right-to-line')],
        sections: [{ title: 'Grain size', icon: 'fa-arrows-left-right-to-line', fields: [text('code', 'Code', REQ), text('grain', 'Grain', REQ)] }],
    },
    {
        slug: 'weathering', title: 'Weathering', singular: 'Weathering Code', icon: 'fa-cloud-sun-rain', group: 'lookups',
        service: crud(weathering, 'Weatherings', 'Weathering'),
        label: r => r.code,
        primary: { key: 'code', sub: 'description' },
        columns: [],
        stats: [total('Total codes', 'fa-cloud-sun-rain')],
        sections: [{ title: 'Weathering code', icon: 'fa-cloud-sun-rain', fields: [text('code', 'Code', { ...REQ, span: 'full' }), area('description', 'Description')] }],
    },
];

export const GROUPS = {
    exploration: { label: 'Exploration',       icon: 'fa-compass-drafting', section: 'Operations' },
    drilling:    { label: 'Drilling',          icon: 'fa-bore-hole',        section: 'Operations' },
    assays:      { label: 'Sampling & Assays', icon: 'fa-flask-vial',       section: 'Operations' },
    lab:         { label: 'Lab & Finance',     icon: 'fa-file-invoice',     section: 'Operations' },
    lookups:     { label: 'Lookups',           icon: 'fa-sliders',          section: 'Configurations' },
    admin:       { label: 'User Management',   icon: 'fa-users-gear',       section: 'Configurations' },
};

// Backend permission names are <KEY>_<ACTION>, e.g. COLLAR_CREATE. Must match
// RESOURCES in the backend's DataSeeder.
const PERMISSION_KEYS = {
    'projects': 'PROJECT', 'prospects': 'PROSPECT', 'grids': 'GRID', 'pits': 'PIT',
    'collars': 'COLLAR', 'rab-collars': 'RAB_COLLAR', 'mw-s': 'MW_S', 'drill-surveys': 'DRILL_SURVEY',
    'core-sizes': 'CORE_SIZE', 'per-area-holes': 'PER_AREA_HOLE',
    'drills': 'DRILL', 'samples': 'SAMPLE', 'composites': 'COMPOSITE', 'compos-au': 'COMPOS_AU',
    'lithology': 'LITHOLOGY', 'std-references': 'STD_REFERENCE',
    'dispatches': 'DISPATCH', 'differences': 'DIFFERENCE', 'invoices': 'INVOICE',
    'branches': 'BRANCH', 'elements': 'ELEMENT', 'colours': 'COLOUR', 'rocks': 'ROCK',
    'qualifiers': 'QUALIFIER', 'schistosity': 'SCHISTOSITY', 'sizes': 'SIZE', 'weathering': 'WEATHERING',
    'users': 'USER', 'roles': 'ROLE', 'permissions': 'PERMISSION',
};
const permissionKey = (slug) => PERMISSION_KEYS[slug] ?? slug.replace(/-/g, '_').toUpperCase();

export const RESOURCES = Object.fromEntries(LIST.map(r => [r.slug, {
    ...r,
    href: `/dashboard/${r.slug}`,
    fields: r.sections.flatMap(s => s.fields),
    permissions: {
        view:   `${permissionKey(r.slug)}_VIEW`,
        add:    `${permissionKey(r.slug)}_CREATE`,
        edit:   `${permissionKey(r.slug)}_UPDATE`,
        delete: `${permissionKey(r.slug)}_DELETE`,
    },
}]));

export const RESOURCE_LIST = Object.values(RESOURCES);
