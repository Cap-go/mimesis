// By @daolf

// Prerequisite: install Scriptable @ https://apps.apple.com/us/app/scriptable/id1405459188

const API_TOKEN = '***'
const API_SECRET = '***'

// Recreating a basic auth with Scriptable lib
const auth = `Basic ${btoa(`${API_TOKEN}:${API_SECRET}`)}`
const currentYear = new Date().getYear()
const startDate = `${currentYear}-01-01`
const endDate = `${currentYear}-12-31`
const endpointTotal = `https://api.chartmogul.com/v1/metrics/mrr?start-date=${startDate}&end-date=${endDate}`
const endpointCapgo = `https://api.chartmogul.com/v1/metrics/mrr?start-date=${startDate}&end-date=${endDate}&plans=Solo,Team,Pay%20as%20you%20go,Maker`
const endpointCaptime = `https://api.chartmogul.com/v1/metrics/mrr?start-date=${startDate}&end-date=${endDate}&plans=Captime%20PRO,Captime%20PRO%20Monthly,Captime%20PRO%20yearly%20deal,ee.forgr.captime.pro2,ee.forgr.captime.pro_deal,ee.forgr.captime.pro_monthly`

async function loadItems(at) {
  const req = new Request(at)
  req.headers = { Authorization: auth }
  const response = await req.loadJSON()
  return response
}
// Request the MRR data
const jsonTotal = await loadItems(endpointTotal)
const jsonCapgo = await loadItems(endpointCapgo)
const jsonCaptime = await loadItems(endpointCaptime)
const MRRTotal = Math.floor(jsonTotal.summary.current / 100).toString()
const MRRCapgo = Math.floor(jsonCapgo.summary.current / 100).toString()
const MRRCaptime = Math.floor(jsonCaptime.summary.current / 100).toString()

// Create the widget
const w = new ListWidget()
w.backgroundColor = new Color('#3880ff')
const t1 = w.addText('Total MRR')
t1.textColor = Color.white()
t1.font = new Font('Avenir-Heavy', 16)

const t2 = w.addText(`€${new Intl.NumberFormat('en-US').format(MRRTotal)}`)
t2.textColor = Color.white()
t2.font = new Font('Avenir-Heavy', 24)
w.addSpacer(4)

const t3 = w.addText('Capgo MRR')
t3.textColor = Color.white()
t3.font = new Font('Avenir-Heavy', 12)

const t4 = w.addText(`€${new Intl.NumberFormat('en-US').format(MRRCapgo)}`)
t4.textColor = Color.white()
t4.font = new Font('Avenir-Heavy', 18)

const t5 = w.addText('Captime MRR')
t5.textColor = Color.white()
t5.font = new Font('Avenir-Heavy', 12)

const t6 = w.addText(`€${new Intl.NumberFormat('en-US').format(MRRCaptime)}`)
t6.textColor = Color.white()
t6.font = new Font('Avenir-Heavy', 18)

Script.setWidget(w)
Script.complete()
