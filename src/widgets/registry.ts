import {
  AccessTime, Air, BatteryFull, BarChart, Bolt, DeviceThermostat, DonutLarge, ElectricBolt,
  Explore, GridOn, History, Image, LightMode, Lock, Map, NetworkCell, Notes, Palette, Place,
  Sensors, ShowChart, Speed, SportsEsports, TableChart, Timeline, ToggleOn, TouchApp, Tune,
  WarningAmber, WaterDrop, Web, AccountTree, LocalFireDepartment, NotificationsActive,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import type { WidgetDefinition, WidgetField, WidgetVisual, WidgetCategory, WidgetSize, WidgetDirection } from './core/types';
import { bars, spark, spark2 } from './data/mockData';

const nf = (key='value', labelEn='Value', labelFa='مقدار', unit?:string): WidgetField => ({ key, labelEn, labelFa, type:'number', unit, required:true });
const sf = (key:string, labelEn:string, labelFa:string): WidgetField => ({ key, labelEn, labelFa, type:'string' });
const bf = (key='value', labelEn='State', labelFa='وضعیت'): WidgetField => ({ key, labelEn, labelFa, type:'boolean', required:true });
const geo: WidgetField = { key:'location', labelEn:'Location', labelFa:'موقعیت', type:'geo', required:true };

const demoDevices = [
  { en: 'Boiler room · Node-04', fa: 'اتاق بویلر · نود ۰۴', zoneEn: 'Factory A', zoneFa: 'کارخانه A' },
  { en: 'Cold storage · Sensor-12', fa: 'سردخانه · سنسور ۱۲', zoneEn: 'Warehouse', zoneFa: 'انبار' },
  { en: 'Greenhouse · Edge-02', fa: 'گلخانه · اج ۰۲', zoneEn: 'Greenhouse', zoneFa: 'گلخانه' },
  { en: 'Pump station · GW-01', fa: 'ایستگاه پمپ · GW-01', zoneEn: 'Pump station', zoneFa: 'ایستگاه پمپ' },
  { en: 'Tracker · Truck-18', fa: 'ردیاب · کامیون ۱۸', zoneEn: 'Fleet', zoneFa: 'ناوگان' },
  { en: 'HVAC panel · AHU-03', fa: 'تابلو تهویه · AHU-03', zoneEn: 'Building B', zoneFa: 'ساختمان B' },
];
const hash = (value: string) => [...value].reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
const demoMeta = (id: string) => {
  const item = demoDevices[hash(id) % demoDevices.length];
  return {
    deviceName: item.en,
    deviceNameFa: item.fa,
    locationLabel: item.zoneEn,
    locationLabelFa: item.zoneFa,
    status: 'Live',
    statusFa: 'زنده',
    lastSeen: '2 min ago',
    lastSeenFa: '۲ دقیقه قبل',
  };
};

type Opt = {
  id:string; title:string; fa:string; desc:string; category:WidgetCategory; visual:WidgetVisual; icon?:SvgIconComponent;
  value?:unknown; unit?:string; size?:WidgetSize; sizes?:WidgetSize[]; fields?:WidgetField[]; mock?:Record<string,unknown>;
  dir?:WidgetDirection; caps?:WidgetDefinition['capabilities'];
};
const w = (o:Opt):WidgetDefinition => ({
  id:o.id, type:o.id, category:o.category, visual:o.visual, titleEn:o.title, titleFa:o.fa, descriptionFa:o.desc,
  icon:o.icon ?? Sensors, defaultSize:o.size ?? '1x1', supportedSizes:o.sizes ?? ['1x1','2x1','2x2'], direction:o.dir ?? 'ltr',
  fields:o.fields ?? [nf('value','Value','مقدار',o.unit)],
  mock:{ value:o.value ?? 68, unit:o.unit ?? '', ...demoMeta(o.id), ...o.mock },
  capabilities:o.caps ?? ['realtime','thresholds'],
});

export const widgetRegistry: WidgetDefinition[] = [
  // Metrics & sensors
  w({id:'temperature',title:'Temperature',fa:'دما',desc:'نمایش دمای لحظه‌ای، روند کوتاه‌مدت و وضعیت نسبت به آستانه‌ها.',category:'metrics',visual:'metric',icon:DeviceThermostat,value:24.8,unit:'°C',mock:{trend:2.4},caps:['realtime','history','thresholds','aggregation']}),
  w({id:'humidity',title:'Humidity',fa:'رطوبت',desc:'نمایش رطوبت نسبی محیط برای پایش شرایط اتاق، گلخانه یا انبار.',category:'metrics',visual:'metric',icon:WaterDrop,value:46,unit:'%',mock:{trend:-1.2}}),
  w({id:'pressure',title:'Pressure',fa:'فشار',desc:'نمایش فشار هوا، خط یا سیال همراه با واحد و روند تغییرات.',category:'metrics',visual:'gauge',icon:Speed,value:2.6,unit:'bar',mock:{max:6}}),
  w({id:'voltage',title:'Voltage',fa:'ولتاژ',desc:'نمایش ولتاژ ورودی یا باتری با قابلیت تعریف بازه مجاز و هشدار.',category:'metrics',visual:'metric',icon:ElectricBolt,value:12.4,unit:'V',mock:{trend:.7}}),
  w({id:'current',title:'Current',fa:'جریان',desc:'نمایش جریان مصرفی تجهیز برای عیب‌یابی و تحلیل بار الکتریکی.',category:'metrics',visual:'metric',icon:Bolt,value:1.82,unit:'A',mock:{trend:3.1}}),
  w({id:'power',title:'Power',fa:'توان',desc:'نمایش توان لحظه‌ای مصرف یا تولید با روند تغییر در بازه زمانی.',category:'metrics',visual:'metric',icon:Bolt,value:284,unit:'W',mock:{trend:-4.2}}),
  w({id:'energy',title:'Energy',fa:'انرژی',desc:'نمایش انرژی تجمعی برای پایش مصرف روزانه، ماهانه یا چرخه کاری.',category:'metrics',visual:'metric',icon:ElectricBolt,value:18.7,unit:'kWh',mock:{trend:8.4},caps:['realtime','history','aggregation']}),
  w({id:'battery',title:'Battery',fa:'باتری',desc:'نمایش درصد شارژ، ولتاژ و زمان تقریبی باقی‌مانده باتری دستگاه.',category:'metrics',visual:'battery',icon:BatteryFull,value:76,unit:'%',mock:{voltage:'3.94 V',remaining:'8h 42m'}}),
  w({id:'light',title:'Light / Lux',fa:'شدت نور',desc:'نمایش شدت روشنایی محیط یا سنسور نوری با واحد لوکس.',category:'metrics',visual:'metric',icon:LightMode,value:685,unit:'lux',mock:{trend:5.6}}),
  w({id:'air-quality',title:'Air Quality',fa:'کیفیت هوا',desc:'نمایش شاخص ترکیبی کیفیت هوا و وضعیت قابل فهم برای کاربر نهایی.',category:'metrics',visual:'gauge',icon:Air,value:64,unit:'AQI',mock:{max:200}}),
  w({id:'co2',title:'CO₂',fa:'دی‌اکسید کربن',desc:'نمایش غلظت CO₂ برای تهویه، کلاس، دفتر و محیط‌های بسته.',category:'metrics',visual:'metric',icon:Air,value:742,unit:'ppm',mock:{trend:6.3}}),
  w({id:'pm25',title:'PM2.5',fa:'ذرات PM2.5',desc:'نمایش غلظت ذرات معلق ریز و هشدار در محدوده‌های نامطلوب.',category:'metrics',visual:'metric',icon:Air,value:18,unit:'µg/m³',mock:{trend:-2.9}}),
  w({id:'gas',title:'Gas Level',fa:'سطح گاز',desc:'نمایش سطح سنسور گاز یا VOC با وضعیت آستانه‌ای ایمن و خطر.',category:'metrics',visual:'gauge',icon:WarningAmber,value:28,unit:'%',mock:{max:100}}),
  w({id:'soil-moisture',title:'Soil Moisture',fa:'رطوبت خاک',desc:'نمایش درصد رطوبت خاک برای آبیاری هوشمند و کشاورزی IoT.',category:'metrics',visual:'tank',icon:WaterDrop,value:58,unit:'%'}),
  w({id:'water-level',title:'Tank / Water Level',fa:'سطح مخزن',desc:'نمایش درصد پرشدگی مخزن و مقدار تخمینی مایع داخل آن.',category:'metrics',visual:'tank',icon:WaterDrop,value:63,unit:'%',mock:{liters:'1,260 L'},sizes:['1x1','1x2','2x1']}),
  w({id:'flow',title:'Flow Rate',fa:'دبی',desc:'نمایش نرخ جریان مایع یا گاز برای لوله، پمپ و کنتور هوشمند.',category:'metrics',visual:'metric',icon:WaterDrop,value:18.4,unit:'L/min',mock:{trend:1.6}}),
  w({id:'speed',title:'Speed',fa:'سرعت',desc:'نمایش سرعت وسیله، موتور یا حرکت خطی در یک بازه تعریف‌شده.',category:'metrics',visual:'gauge',icon:Speed,value:74,unit:'km/h',mock:{max:160}}),
  w({id:'rpm',title:'RPM',fa:'دور موتور',desc:'نمایش دور موتور یا محور دوار همراه با محدوده کاری و هشدار.',category:'metrics',visual:'gauge',icon:Speed,value:2840,unit:' rpm',mock:{max:6000}}),
  w({id:'vibration',title:'Vibration',fa:'لرزش',desc:'نمایش شدت لرزش ماشین برای نگهداری پیشگویانه و تشخیص خرابی.',category:'metrics',visual:'metric',icon:Sensors,value:3.2,unit:'mm/s',mock:{trend:9.2}}),
  w({id:'noise',title:'Noise',fa:'صدا',desc:'نمایش سطح فشار صوتی برای پایش محیط صنعتی یا شهری.',category:'metrics',visual:'metric',icon:Sensors,value:58,unit:'dB',mock:{trend:-.8}}),
  w({id:'distance',title:'Distance',fa:'فاصله',desc:'نمایش فاصله اندازه‌گیری‌شده توسط سنسور اولتراسونیک، ToF یا رادار.',category:'metrics',visual:'metric',icon:Sensors,value:1.84,unit:'m',mock:{trend:.4}}),
  w({id:'weight',title:'Weight',fa:'وزن',desc:'نمایش وزن یا بار اندازه‌گیری‌شده توسط لودسل و باسکول متصل.',category:'metrics',visual:'metric',icon:Sensors,value:42.6,unit:'kg',mock:{trend:1.1}}),
  w({id:'wind',title:'Wind Speed',fa:'سرعت باد',desc:'نمایش سرعت باد برای ایستگاه هواشناسی، مزرعه و تجهیزات بیرونی.',category:'metrics',visual:'gauge',icon:Air,value:12.8,unit:'m/s',mock:{max:35}}),
  w({id:'rain',title:'Rain',fa:'بارش',desc:'نمایش میزان بارندگی ثبت‌شده در بازه اخیر یا مجموع روزانه.',category:'metrics',visual:'metric',icon:WaterDrop,value:6.2,unit:'mm',mock:{trend:12.3}}),
  w({id:'signal',title:'Cellular Signal',fa:'قدرت سیگنال موبایل',desc:'نمایش RSSI/RSRP و کیفیت ارتباط سلولار دستگاه به شکل سریع و قابل خواندن.',category:'metrics',visual:'signal',icon:NetworkCell,value:-72,unit:'dBm',mock:{network:'LTE · RSRP'}}),
  w({id:'device-status',title:'Device Status',fa:'وضعیت دستگاه',desc:'نمایش وضعیت آنلاین، فعال یا خطای دستگاه به‌صورت باینری و فوری.',category:'metrics',visual:'boolean',icon:Sensors,value:true,fields:[bf()],caps:['realtime','thresholds']}),
  w({id:'fire-alarm',title:'Fire Alarm',fa:'هشدار آتش',desc:'نمایش وضعیت اعلام حریق با نماد واضح، حالت عادی/هشدار و امکان تشخیص سریع از فاصله.',category:'metrics',visual:'alarm-indicator',icon:LocalFireDepartment,value:false,fields:[bf('alarm','Alarm','هشدار')],mock:{severity:'critical',status:'Armed',statusFa:'آماده',deviceName:'Fire panel · FACP-01',deviceNameFa:'پنل حریق · FACP-01',locationLabel:'Floor 2',locationLabelFa:'طبقه ۲'},caps:['realtime','thresholds']}),
  w({id:'smoke-alarm',title:'Smoke Detector',fa:'دتکتور دود',desc:'نمایش وضعیت دتکتور دود و سطح هشدار با نشانه بصری فوری برای کاربردهای ایمنی.',category:'metrics',visual:'alarm-indicator',icon:WarningAmber,value:true,fields:[bf('alarm','Alarm','هشدار')],mock:{severity:'warning',status:'Warning',statusFa:'هشدار',deviceName:'Smoke detector · SD-14',deviceNameFa:'دتکتور دود · SD-14',locationLabel:'Server room',locationLabelFa:'اتاق سرور'},caps:['realtime','thresholds']}),
  w({id:'water-leak',title:'Water Leak',fa:'نشتی آب',desc:'نمایش سریع خشک/نشت با آیکون و رنگ وضعیت برای موتورخانه، رک و محیط‌های حساس.',category:'metrics',visual:'alarm-indicator',icon:WaterDrop,value:false,fields:[bf('leak','Leak detected','تشخیص نشتی')],mock:{severity:'info',status:'Dry',statusFa:'خشک',deviceName:'Leak sensor · WL-03',deviceNameFa:'سنسور نشتی · WL-03'},caps:['realtime','thresholds']}),

  // Controls
  w({id:'button',title:'Command Button',fa:'دکمه فرمان',desc:'ارسال فرمان RPC یا Downlink برای اقدام‌هایی مثل ریست، بازکردن یا شروع عملیات.',category:'controls',visual:'button',icon:TouchApp,size:'1x1',fields:[sf('command','Command','فرمان')],caps:['control']}),
  w({id:'switch',title:'Switch / Relay',fa:'کلید روشن/خاموش',desc:'کنترل وضعیت باینری مانند رله، چراغ، پمپ یا خروجی دیجیتال.',category:'controls',visual:'switch',icon:ToggleOn,value:true,fields:[bf()],caps:['control','realtime']}),
  w({id:'slider',title:'Slider',fa:'اسلایدر',desc:'تنظیم پیوسته مقدار مانند شدت نور، سرعت فن، توان یا درصد خروجی.',category:'controls',visual:'slider',icon:Tune,value:65,unit:'%',fields:[nf('value','Target value','مقدار هدف','%')],caps:['control']}),
  w({id:'set-value',title:'Manual Set Value',fa:'ورود مقدار',desc:'ثبت دستی مقدار هدف یا پارامتر عملیاتی با ورودی عددی یا متنی.',category:'controls',visual:'input',icon:Tune,value:22.5,unit:'°C',fields:[nf('value','Target value','مقدار هدف','°C')],caps:['control']}),
  w({id:'thermostat',title:'Thermostat',fa:'ترموستات',desc:'کنترل Setpoint دما با نمایش واضح مقدار هدف در یک کنترل گرد.',category:'controls',visual:'thermostat',icon:DeviceThermostat,value:22,unit:'°C',size:'1x1',sizes:['1x1','2x1','2x2'],caps:['control','realtime']}),
  w({id:'door-lock',title:'Door Lock',fa:'قفل',desc:'کنترل قفل یا دسترسی با وضعیت واضح و مناسب خانه و ساختمان هوشمند.',category:'controls',visual:'switch',icon:Lock,value:false,fields:[bf('locked','Locked','قفل')],caps:['control','realtime']}),
  w({id:'color',title:'RGB / Light Color',fa:'رنگ چراغ',desc:'انتخاب رنگ برای نورپردازی RGB، چراغ هوشمند یا نشانگرهای قابل کنترل.',category:'controls',visual:'color',icon:Palette,fields:[{key:'color',labelEn:'Color',labelFa:'رنگ',type:'color',required:true}],caps:['control']}),
  w({id:'direction',title:'Directional Control',fa:'کنترل جهت',desc:'کنترل جهت حرکت ربات، دوربین PTZ یا عملگرهای چهارجهته.',category:'controls',visual:'direction',icon:SportsEsports,fields:[sf('direction','Direction','جهت')],caps:['control']}),
  w({id:'downlink',title:'Downlink Action',fa:'ارسال Downlink',desc:'ارسال یک فرمان آماده به یک یا چند دستگاه، مناسب LoRaWAN و عملیات گروهی.',category:'controls',visual:'button',icon:TouchApp,fields:[sf('payload','Payload','داده فرمان')],caps:['control','multi-device']}),
  w({id:'siren',title:'Siren / Beacon',fa:'آژیر و چراغ هشدار',desc:'کنترل آژیر یا چراغ گردان با نمایش روشن و واضح وضعیت خروجی.',category:'controls',visual:'switch',icon:NotificationsActive,value:false,fields:[bf('enabled','Enabled','فعال')],mock:{deviceName:'Safety beacon · B-02',deviceNameFa:'چراغ هشدار · B-02',status:'Ready',statusFa:'آماده'},caps:['control','realtime']}),
  w({id:'fan-control',title:'Fan Speed',fa:'سرعت فن',desc:'کنترل سرعت فن یا بلوئر با درصد خروجی و بازخورد بصری مناسب تهویه و تجهیزات صنعتی.',category:'controls',visual:'slider',icon:Air,value:72,unit:'%',fields:[nf('speed','Fan speed','سرعت فن','%')],mock:{range:'0 — 100',deviceName:'AHU fan · FAN-03',deviceNameFa:'فن هواساز · FAN-03'},caps:['control','realtime']}),

  // Charts & history
  w({id:'time-series',title:'Time Series',fa:'نمودار زمانی',desc:'نمایش روند تاریخی یک یا چند متغیر در بازه زمانی انتخابی.',category:'charts',visual:'line',icon:ShowChart,size:'2x1',sizes:['2x1','2x2','3x1','3x2'],fields:[{key:'series',labelEn:'Series',labelFa:'سری‌ها',type:'array',required:true}],mock:{values:spark,summary:'24.8 °C'},caps:['history','aggregation','thresholds','multi-device']}),
  w({id:'area-chart',title:'Area Chart',fa:'نمودار سطحی',desc:'نمایش روند تاریخی با سطح پرشده برای درک سریع حجم و تغییرات.',category:'charts',visual:'area',icon:ShowChart,size:'2x1',sizes:['2x1','2x2','3x1','3x2'],mock:{values:spark2,summary:'18.7 kWh'},caps:['history','aggregation','multi-device']}),
  w({id:'bar-chart',title:'Bar Chart',fa:'نمودار میله‌ای',desc:'مقایسه مقادیر دسته‌ای، دستگاه‌ها یا دوره‌های زمانی در قالب میله‌ای.',category:'charts',visual:'bar',icon:BarChart,size:'2x1',sizes:['2x1','2x2','3x1'],mock:{values:bars},fields:[{key:'series',labelEn:'Series',labelFa:'سری‌ها',type:'array'}],caps:['history','aggregation','multi-device']}),
  w({id:'gauge',title:'Gauge',fa:'گیج',desc:'نمایش موقعیت یک مقدار بین حداقل و حداکثر با آستانه‌های عملیاتی.',category:'charts',visual:'gauge',icon:Speed,value:68,unit:'%',mock:{max:100},caps:['realtime','thresholds']}),
  w({id:'histogram',title:'Histogram',fa:'هیستوگرام',desc:'نمایش توزیع داده‌ها برای بررسی پراکندگی، تراکم و محدوده‌های پرتکرار.',category:'charts',visual:'histogram',icon:BarChart,size:'2x1',sizes:['2x1','2x2','3x1'],fields:[{key:'samples',labelEn:'Samples',labelFa:'نمونه‌ها',type:'array'}],caps:['history','aggregation']}),
  w({id:'donut',title:'Donut / Pie',fa:'دایره‌ای',desc:'نمایش سهم بخش‌ها یا درصد استفاده از ظرفیت در یک نگاه.',category:'charts',visual:'donut',icon:DonutLarge,value:72,unit:'%',caps:['aggregation']}),
  w({id:'heatmap',title:'Heatmap',fa:'نقشه حرارتی',desc:'نمایش شدت یا فراوانی داده در دو بعد برای پیدا کردن الگو و نقاط بحرانی.',category:'charts',visual:'heatmap',icon:GridOn,size:'2x1',sizes:['2x1','2x2','3x2'],fields:[{key:'matrix',labelEn:'Matrix',labelFa:'ماتریس',type:'array'}],caps:['history','thresholds']}),
  w({id:'state-timeline',title:'State Timeline',fa:'خط زمانی وضعیت',desc:'نمایش تغییر حالت‌های گسسته دستگاه مانند روشن، خاموش، هشدار و توقف در طول زمان.',category:'charts',visual:'timeline',icon:Timeline,size:'3x1',sizes:['2x1','3x1','3x2'],fields:[{key:'states',labelEn:'States',labelFa:'وضعیت‌ها',type:'array'}],caps:['history','thresholds','multi-device']}),
  w({id:'status-history',title:'Status History',fa:'تاریخچه وضعیت',desc:'نمایش دوره‌های وضعیت چند تجهیز برای مقایسه پایداری و رخدادهای عملیاتی.',category:'charts',visual:'timeline',icon:History,size:'3x1',sizes:['2x1','3x1','3x2'],fields:[{key:'states',labelEn:'States',labelFa:'وضعیت‌ها',type:'array'}],caps:['history','multi-device']}),

  // Location
  w({id:'map',title:'Map',fa:'نقشه',desc:'نمایش موقعیت یک یا چند دستگاه روی نقشه؛ مناسب ناوگان، دارایی و سنسورهای سیار.',category:'location',visual:'map',icon:Map,size:'2x2',sizes:['2x2','3x2','3x3'],fields:[geo],caps:['geo','realtime','multi-device']}),
  w({id:'location',title:'Coordinates',fa:'مختصات',desc:'نمایش دقیق طول و عرض جغرافیایی، دقت GPS و اطلاعات موقعیت خام.',category:'location',visual:'coordinates',icon:Place,size:'1x1',fields:[geo],mock:{lat:'35.7219° N',lng:'51.3347° E',accuracy:'4.2 m'},caps:['geo','realtime']}),
  w({id:'route',title:'Route / Track',fa:'مسیر حرکت',desc:'نمایش مسیر تاریخی حرکت دستگاه و نقاط منتخب روی مسیر.',category:'location',visual:'route',icon:Map,size:'2x2',sizes:['2x2','3x2','3x3'],fields:[{key:'points',labelEn:'Track points',labelFa:'نقاط مسیر',type:'array'}],mock:{location:'Route · 12.4 km'},caps:['geo','history']}),
  w({id:'compass',title:'Compass / Heading',fa:'قطب‌نما',desc:'نمایش جهت حرکت یا Heading سنسور با درجه و جهت اصلی.',category:'location',visual:'compass',icon:Explore,value:327,unit:'°',caps:['realtime','geo']}),

  // Tables & events
  w({id:'device-table',title:'Device Table',fa:'جدول دستگاه‌ها',desc:'نمایش چند دستگاه و وضعیت‌ها یا متریک‌های کلیدی در قالب جدول قابل اسکن.',category:'tables',visual:'table',icon:TableChart,size:'3x2',sizes:['2x2','3x2','3x3'],fields:[{key:'devices',labelEn:'Devices',labelFa:'دستگاه‌ها',type:'array'}],caps:['realtime','multi-device','thresholds']}),
  w({id:'measurement-list',title:'Measurement List',fa:'لیست اندازه‌گیری',desc:'نمایش مقادیر تاریخی به همراه زمان ثبت برای بررسی سریع داده خام.',category:'tables',visual:'measurement-list',icon:History,size:'2x2',sizes:['2x2','3x2'],fields:[{key:'measurements',labelEn:'Measurements',labelFa:'اندازه‌گیری‌ها',type:'array'}],caps:['history','thresholds']}),
  w({id:'alarms',title:'Alarms',fa:'هشدارها',desc:'نمایش هشدارهای فعال یا اخیر همراه با سطح شدت، زمان و عنوان رخداد.',category:'tables',visual:'alarms',icon:WarningAmber,size:'2x2',sizes:['2x2','3x2'],fields:[{key:'alarms',labelEn:'Alarms',labelFa:'هشدارها',type:'array'}],caps:['realtime','history','thresholds']}),
  w({id:'events',title:'Event History',fa:'تاریخچه رویداد',desc:'نمایش رویدادهای عملیاتی مانند بازشدن شیر، شروع پمپ یا تغییر مود.',category:'tables',visual:'events',icon:History,size:'2x2',sizes:['2x2','3x2'],fields:[{key:'events',labelEn:'Events',labelFa:'رویدادها',type:'array'}],caps:['history']}),
  w({id:'logs',title:'Logs',fa:'لاگ‌ها',desc:'نمایش آخرین پیام‌های سیستمی یا رخدادهای فنی برای عیب‌یابی دستگاه و گیت‌وی.',category:'tables',visual:'logs',icon:Notes,size:'2x2',sizes:['2x2','3x2'],fields:[{key:'logs',labelEn:'Logs',labelFa:'لاگ‌ها',type:'array'}],caps:['realtime','history']}),

  // Display & custom
  w({id:'clock',title:'Clock',fa:'ساعت',desc:'نمایش زمان و تاریخ محلی یا زمان سایت برای داشبوردهای اتاق کنترل.',category:'display',visual:'clock',icon:AccessTime,size:'1x1',fields:[{key:'timezone',labelEn:'Timezone',labelFa:'منطقه زمانی',type:'string'}],caps:['custom-content']}),
  w({id:'text',title:'Text / Markdown',fa:'متن و توضیحات',desc:'نمایش توضیحات، راهنما، وضعیت خلاصه یا محتوای Markdown داخل داشبورد.',category:'display',visual:'text',icon:Notes,size:'2x1',sizes:['1x1','2x1','2x2'],dir:'auto',fields:[sf('content','Content','محتوا')],caps:['custom-content']}),
  w({id:'image',title:'Image / Camera Snapshot',fa:'تصویر یا عکس دوربین',desc:'نمایش تصویر ثابت، اسنپ‌شات دوربین یا تصویر وضعیت دستگاه.',category:'display',visual:'image',icon:Image,size:'2x1',sizes:['2x1','2x2','3x2'],fields:[sf('url','Image URL','آدرس تصویر')],caps:['custom-content','realtime']}),
  w({id:'iframe',title:'iFrame / External Content',fa:'محتوای خارجی',desc:'جاسازی صفحه، ابزار یا محتوای وب خارجی در محدوده یک ویجت.',category:'display',visual:'iframe',icon:Web,size:'2x1',sizes:['2x1','2x2','3x2'],fields:[sf('url','URL','آدرس')],caps:['custom-content']}),
  w({id:'scada',title:'SCADA / Mimic',fa:'نمایش شماتیک SCADA',desc:'نمایش شماتیک فرایند شامل مخزن، پمپ، شیر و وضعیت‌های زنده برای کاربرد صنعتی.',category:'display',visual:'scada',icon:AccountTree,size:'3x2',sizes:['2x2','3x2','3x3'],fields:[{key:'bindings',labelEn:'Bindings',labelFa:'اتصال داده‌ها',type:'array'}],caps:['realtime','control','custom-content']}),
];

export const widgetCategories = ['metrics','controls','charts','location','tables','display'] as const;
