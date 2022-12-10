import xapi from 'xapi';

var currentMode = '';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setupEvents() {
  // on change of video source
  xapi.Status.Video.Input.MainVideoSource.on(source => {
    updateUI(source)
  })

  // on selecting camera mode from UI
  xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if (event.WidgetId == 'widget_cameraMode' && event.Type == 'released') {
      switch(event.Value) {
        case 'cmAuto':
          xapi.command('Video Input SetMainVideoSource', {ConnectorId: ['1', '2'], Layout: 'Equal'})
          currentMode = 'auto'
          break
        case 'cmAudienceOnly':
          xapi.command('Video Input SetMainVideoSource', {ConnectorId: '1'})
          currentMode = 'audience'
          break
        default:
          xapi.command('Video Input SetMainVideoSource', {ConnectorId: '2'})
          currentMode = 'presenter'
          break
      }
      setupPresenterTracking()
      setupSpeakerTracking()
    }
  })
}

async function setupPresenterTracking() {
  if (currentMode == 'auto' || currentMode == 'presenter') {
    const presenterTrackingAvailable = await xapi.Status.Cameras.PresenterTrack.Availability.get()
    if (presenterTrackingAvailable != 'Unavailable') {
      await xapi.Config.Cameras.PresenterTrack.Enabled.set(true)
      await xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Persistent' })
    }
  }
}

async function setupSpeakerTracking() {
  if (currentMode == 'auto' || currentMode == 'audience') {
    const speakerTrackingAvailable = await xapi.Status.Cameras.SpeakerTrack.Availability.get()
    if (speakerTrackingAvailable != 'Unavailable') {
      await xapi.Config.Cameras.SpeakerTrack.Mode.set('Auto')
      await xapi.Command.Cameras.SpeakerTrack.Activate()
    }
  }
}

async function updateUI(currentSource) {
  switch (currentSource) {
      case '1':
        xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_cameraMode', Value: 'cmAudienceOnly'})
        currentMode = 'audience'
        break
      case '2':
        xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_cameraMode', Value: 'cmPresenterOnly'})
        currentMode = 'presenter'
        break
      default:
        //xapi.command('Video Input SetMainVideoSource', {ConnectorId: ['1', '2'], Layout: 'Equal'})
        xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_cameraMode', Value: 'cmAuto'})
        currentMode = 'auto'
        break
    }
}

async function buildUI() {
  let panelExists = false
  let panels = await xapi.command('UserInterface Extensions List', { ActivityType: 'Custom' })
  try {
    for (let i = 0; i < panels.Extensions.Panel.length; i++) {
      if (panels.Extensions.Panel[i].PanelId == 'panel_cameraMode') {
        panelExists = true
        break
      }
    }
  } catch (error) {
    console.debug(error)
  }
  if (!panelExists) {
    xapi.command('Userinterface Extensions Panel Save', {
      PanelId: 'panel_cameraMode'
    }, `<Extensions>
  <Panel>
    <Origin>local</Origin>
    <Type>Statusbar</Type>
    <Icon>Sliders</Icon>
    <Color>#875AE0</Color>
    <Name>Camera Mode</Name>
    <ActivityType>Custom</ActivityType>
    <Page>
      <Name>Camera Mode</Name>
      <Row>
        <Name>Row</Name>
        <Widget>
          <WidgetId>widget_cameraMode</WidgetId>
          <Type>GroupButton</Type>
          <Options>size=4;columns=1</Options>
          <ValueSpace>
            <Value>
              <Key>cmAuto</Key>
              <Name>Auto (Presenter and Audience)</Name>
            </Value>
            <Value>
              <Key>cmPresenterOnly</Key>
              <Name>Presenter Only</Name>
            </Value>
            <Value>
              <Key>cmAudienceOnly</Key>
              <Name>Audience Only</Name>
            </Value>
          </ValueSpace>
        </Widget>
      </Row>
      <Options>hideRowNames=1</Options>
    </Page>
  </Panel>
</Extensions>`)
    console.debug({
      Message: `Camera Mode panel missing! re-building UI`,
      Associated_Function: 'buildUI()'
    })
  } else {
    console.debug({
      Message: 'Camera Mode panel found, no action neccessary',
      Associated_Function: 'buildUI()'
    })
  }
}

async function init() {
  await buildUI()
  const currentMainVideoSource = await xapi.Status.Video.Input.MainVideoSource.get()
  await updateUI(currentMainVideoSource)
  await sleep(250)
  await setupPresenterTracking()
  await sleep(250)
  await setupSpeakerTracking()
  await sleep(100)
  await setupEvents()
}

init()
