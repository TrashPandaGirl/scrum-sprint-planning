// Loads the pure calculation code straight out of scrum-sprint-planner.html,
// so tests always run against the code that ships (no duplicated copy).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'scrum-sprint-planner.html'), 'utf8');

function slice(from, to) {
  const start = html.indexOf(from);
  const end = html.indexOf(to, start);
  if (start < 0 || end < 0) throw new Error(`Marker not found: ${from} … ${to}`);
  return html.slice(start, end + to.length);
}

const source = [
  slice('function getAustrianHolidays', 'Object.assign(HOLIDAYS,getAustrianHolidays(y));'),
  slice('function curSprint()', 'function teamTotalCapacity(){return state.members.reduce((s,m)=>s+memberSprintCapacity(m),0);}'),
].join('\n');

function loadCalc(state) {
  const ctx = vm.createContext({ state });
  vm.runInContext(
    `${source}\n;this.api={getAustrianHolidays,HOLIDAYS,isHoliday,isWorkday,getSprintDays,getSprintWorkdays,memberDailyRate,memberMeetingHours,memberTheoreticalMaxHours,memberTheoreticalMax,memberSprintCapacity,teamTotalCapacity};`,
    ctx,
  );
  return ctx.api;
}

module.exports = { loadCalc };
