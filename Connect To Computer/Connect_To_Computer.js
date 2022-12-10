import xapi from 'xapi';

//[Configuration Start]*************************/

const hideCustomPanels_inConnect2ComputerMode = false;          // Default Value: false; Accepted Values: <true, false>
const hideCustomPanels_inConnect2ComputerMode_PanelIds = [];    // Example Format: ["panel_1", "panel_2", "panel_3", "panel_Etc"]

const hideCustomPanels_inDefaultMode = false;                   // Default Value: false; Accepted Values: <true, false>
const hideCustomPanels_inDefaultMode_PanelIds = [];             // Example Format: ["panel_4", "panel_5", "panel_6"]

const touchAvatarCorrection_Mode = true;                        // Default Value: true; Accepted Values: <true, false>

//[Configuration End]***************************/

//[State]***************************************/

var connect2ComputerModeEnabled = false;

//[State End]***********************************/

//*****[UI interactions]************************/
xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
  switch (event.PanelId) {
  case 'connect2Comp_widget_disabled':
    xapi.Config.Video.Monitors.get().then((mode) => {
      if (mode != 'Auto') {
        swapUI(true)
        runConnect2ComputerMode()
      } else {
        monitorOnAutoError()
      }
    })
    break;
  case 'connect2Comp_widget_enabled':
    runDefaults()
    swapUI(false)
    break;
  default:
    break;
  }
})

//*****[Standby]***********************************/
xapi.status.on('Standby State', (status) => {
  if (!connect2ComputerModeEnabled) return

    switch (status) {
    case 'Standby':
    case 'EnteringStandby':
    case 'Halfwake':
      xapi.Command.Standby.Deactivate()
      break;
    default:
      break;
    }
  })

//*****[Init]***********************************/
async function init() {
  let checkMonitorMode = await xapi.Config.Video.Monitors.get()
  if (checkMonitorMode != 'Auto') {
    checkUI()
    await sleep(125)
  } else {
    await monitorOnAutoError()
  }
}

init()

//*****[Functions]******************************/

async function monitorOnAutoError() {
  let message = { Error: 'Connect To Computer Disabled', Message: 'The configuration "Video Monitors Auto" is not allowed. Follow the step-by-step instructions for configuring your codec web interface with manual monitor values and try again.' }
  let macro = module.name.split('./')[1]
  await xapi.Command.UserInterface.Message.Alert.Display({
    Title: message.Error,
    Text: message.Message,
    Duration: 30
  })
  console.error(message)
  await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: 'connect2Comp_widget_disabled' }).catch(e => e)
  await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: 'connect2Comp_widget_enabled' }).catch(e => e)
  await xapi.Command.Macros.Macro.Deactivate({ Name: macro })
  await xapi.Command.Macros.Runtime.Restart()
}

async function runDefaults() {
  connect2ComputerModeEnabled = false
  console.log('Exiting Connect To Computer mode')
  await sleep(100)
  /***[Commands to run on disable]*******************************************************************/
  /*await xapi.command('Conference DoNotDisturb Deactivate').then(() => {
    console.debug('runDefaults()', 'DND Deactivated')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on the command "Conference DoNotDisturb Deactivate"',
      'Associated_Function': 'runDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })*/
  /**********************************************************************/
  await avatarCorrection(true)
  await sleep(500)
}

async function runConnect2ComputerMode() {
  connect2ComputerModeEnabled = true
  console.log('Entering Connect 2 Computer Mode')
  await xapi.config.set('Video Monitors', 'Dual').then(() => {
    console.debug('runConnect2ComputerMode()', 'video_Monitors set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on setting the config of "Video Monitors"',
      'Associated_Function': 'runDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.config.set('Video Output Connector 1 MonitorRole', 'First').then(() => {
    console.debug('runConnect2ComputerMode()', 'monitor_Role conx_1 set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on setting the config of "Video Output Connector 1 MonitorRole"',
      'Associated_Function': 'runConnect2ComputerMode()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second').then(() => {
    console.debug('runConnect2ComputerMode()', 'monitor_Role conx_2 set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on setting the config of "Video Output Connector 2 MonitorRole"',
      'Associated_Function': 'runConnect2ComputerMode()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '1').then((response) => {
    console.debug('runConnect2ComputerMode()', 'hzOffset_2 set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on setting the config of "HorizontalOffset 2"',
      'Associated_Function': 'runConnect2ComputerMode()',
      'Connect': connect
    }
    console.debug(error)
  })
  /***[Other Commands]*******************************************************************/
  /*await xapi.command('Conference DoNotDisturb Activate', {
    Timeout: '1440'
  }).then(() => {
    console.debug('runConnect2ComputerMode()', 'DND Activate')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on the command "Conference DoNotDisturb Activate"',
      'Associated_Function': 'runConnect2ComputerMode()',
      'Connect': connect
    }
    console.debug(error)
  })*/
  /**********************************************************************/
  avatarCorrection(false)
  await sleep(500)
  // Changing self-view should always run last
  await xapi.command('Video Selfview Set', {
    Mode: 'On',
    FullscreenMode: 'On',
    OnMonitorRole: 'Second'
  }).then(() => {
    console.debug('runConnect2ComputerMode()', 'selfView set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on the command "Video Selfview Set"',
      'Associated_Function': 'runConnect2ComputerMode()',
      'Connect': connect
    }
    console.debug(error)
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

//*****[UI Functions]**********************************************************/

async function buildPanels() {
  let check4panels = 0
  let panels = await xapi.command('UserInterface Extensions List', { ActivityType: 'Custom' })
  try {
    for (let i = 0; i < panels.Extensions.Panel.length; i++) {
      switch (panels.Extensions.Panel[i].PanelId) {
      case 'connect2Comp_widget_enabled':
      case 'connect2Comp_widget_disabled':
        check4panels++
        break
      default:
        break
      }
    }
  } catch (error) {
    console.debug(error)
  }
  if (check4panels < 2) {
    xapi.command('Userinterface Extensions Panel Save', {
      PanelId: 'connect2Comp_widget_disabled'
    }, `<Extensions>
    <Panel>
    <Origin>local</Origin>
    <Type>Home</Type>
    <Icon>Input</Icon>
    <Color>#335A9A</Color>
    <Visibility>Always</Visibility>
    <Name>Connect To Computer</Name>
    <ActivityType>Custom</ActivityType>
    </Panel>
    </Extensions>`)
    xapi.command('Userinterface Extensions Panel Save', {
      PanelId: 'connect2Comp_widget_enabled'
    }, `<Extensions>
    <Panel>
    <Origin>local</Origin>
    <Type>Home</Type>
    <Icon>Input</Icon>
    <Color>#FFA300</Color>
    <Visibility>Always</Visibility>
    <Name>Disconnect From Computer</Name>
    <ActivityType>Custom</ActivityType>
    </Panel>
    </Extensions>`)
    console.debug({
      Message: `Connect To Computer Panel(s) missing! re-building panels`,
      Associated_Function: 'buildPanels()'
    })
  } else {
    console.debug({
      Message: 'Connect To Computer Panels found, no action neccessary',
      Associated_Function: 'buildPanels()'
    })
  }
}

async function swapUI(state) {
  if (state) {
    //xapi.config.set('UserInterface Features HideAll', 'True')
    customPanel_visibility('Hidden')
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'connect2Comp_widget_disabled',
      Visibility: 'Hidden'
    })
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'connect2Comp_widget_enabled',
      Visibility: 'Auto'
    })
  } else {
    //xapi.config.set('UserInterface Features HideAll', 'False')
    customPanel_visibility('Auto')
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'connect2Comp_widget_disabled',
      Visibility: 'Auto'
    })
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'connect2Comp_widget_enabled',
      Visibility: 'Hidden'
    })
  }
}

async function checkUI() {
  await buildPanels()
  await swapUI(false)
  await avatarCorrection(true)
}

//*****[Config Functions]**********************************************************/

// Hide Custom Panels

function customPanel_visibility(state) {
  let inverse = 'Auto';
  let panels = {
    "Message": "",
    "Panels": []
  }
  if (hideCustomPanels_inConnect2ComputerMode.toString() == "true" ? true : false) {
    if (state == "Hidden") {
      panels.Message = 'Hide Custom UI in Connect To Computer Mode is enabled, Hiding the following panel IDs: '
    } else {
      panels.Message = 'Hide Custom UI in Connect To Computer Mode is enabled, Showing the following panel IDs: '
    }
    for (let i = 0; i < hideCustomPanels_inConnect2ComputerMode_PanelIds.length; i++) {
      panels.Panels.push(hideCustomPanels_inConnect2ComputerMode_PanelIds[i])
      xapi.command('UserInterface Extensions Panel Update', {
        PanelId: hideCustomPanels_inConnect2ComputerMode_PanelIds[i],
        Visibility: state
      }).catch(e => console.debug(e))
    }
    console.debug(panels)
  } else {
    for (let i = 0; i < hideCustomPanels_inConnect2ComputerMode_PanelIds.length; i++) {
      panels.Panels.push(hideCustomPanels_inConnect2ComputerMode_PanelIds[i])
      xapi.command('UserInterface Extensions Panel Update', {
        PanelId: hideCustomPanels_inConnect2ComputerMode_PanelIds[i],
        Visibility: 'Auto'
      }).catch(e => console.debug(e))
    }
  }
  if (hideCustomPanels_inDefaultMode.toString() == "true" ? true : false) {
    if (state == 'Auto') {
      inverse = 'Hidden';
      panels.Message = 'Hide Custom UI in Default Mode is enabled, Hiding the following panel IDs: '
    } else {
      inverse = 'Auto'
      panels.Message = 'Hide Custom UI in Default Mode is enabled, Showing the following panel IDs: '
    }
    for (let i = 0; i < hideCustomPanels_inDefaultMode_PanelIds.length; i++) {
      panels.Panels.push(hideCustomPanels_inDefaultMode_PanelIds[i])
      xapi.command('UserInterface Extensions Panel Update', {
        PanelId: hideCustomPanels_inDefaultMode_PanelIds[i],
        Visibility: inverse
      }).catch(e => console.debug(e))
    }
    console.debug(panels)
  } else {
    for (let i = 0; i < hideCustomPanels_inDefaultMode_PanelIds.length; i++) {
      panels.Panels.push(hideCustomPanels_inDefaultMode_PanelIds[i])
      xapi.command('UserInterface Extensions Panel Update', {
        PanelId: hideCustomPanels_inDefaultMode_PanelIds[i],
        Visibility: 'Auto'
      }).catch(e => console.debug(e))
    }
  }
}

async function avatarCorrection(state) {
  let monitors = await xapi.Config.Video.Monitors.get().catch(e => console.debug(e))
  if (touchAvatarCorrection_Mode.toString() == "true" ? true : false) {
    switch (monitors) {
    case 'Single':
      if (state) {
        await xapi.config.set('Video Output Connector 2 MonitorRole', 'First')
        await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '0')
      } else {
        await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second')
        await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '1')
      }
      break
    default:
      await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second')
      await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '1')
      break
    }
  } else {
    await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second')
    await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '1')
  }
}
