const DYMO_LABEL_XML = `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="twips">
  <PaperOrientation>Landscape</PaperOrientation>
  <Id>Address</Id>
  <PaperName>30252 Address</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="1581" Height="5040" Rx="270" Ry="270" />
  </DrawCommands>
  <ObjectInfo>
    <AddressObject>
      <Name>Address</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
      <BackColor Alpha="0" Red="255" Green="255" Blue="255" />
      <LinkedObjectName />
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>True</IsVariable>
      <HorizontalAlignment>Left</HorizontalAlignment>
      <VerticalAlignment>Middle</VerticalAlignment>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <UseFullFontHeight>True</UseFullFontHeight>
      <Verticalized>False</Verticalized>
      <StyledText>
        <Element>
          <String>Ticket</String>
          <Attributes>
            <Font Family="Arial" Size="13" Bold="True" Italic="False" Underline="False" Strikeout="False" />
            <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
          </Attributes>
        </Element>
      </StyledText>
      <ShowBarcode>False</ShowBarcode>
      <BarcodePosition>AboveAddress</BarcodePosition>
      <LineFonts />
    </AddressObject>
    <Bounds X="332" Y="150" Width="4455" Height="1260" />
  </ObjectInfo>
</DieCutLabel>`;

function getFramework() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.dymo?.label?.framework || null;
}

function normalizeDymoPrinter(printer) {
  return {
    name: printer.name || printer.printerName || "DYMO Printer",
    modelName: printer.modelName || "",
    printerType: printer.printerType || ""
  };
}

export function buildTicketLabelText(ticket) {
  return [
    ticket.ticketNumber ? `#${ticket.ticketNumber}` : "",
    ticket.checkInDate || "",
    ticket.customerName || "",
    ticket.device || "",
    ticket.phone || "",
    ticket.password ? `PW: ${ticket.password}` : "",
    ticket.issue || "",
    ticket.accessories ? `Acc: ${ticket.accessories}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function getDymoPrinters() {
  const framework = getFramework();

  if (!framework) {
    return [];
  }

  try {
    framework.init();
    const printers = framework.getPrinters?.() || [];
    return printers.map(normalizeDymoPrinter);
  } catch (_error) {
    return [];
  }
}

export function getDymoAvailability() {
  const framework = getFramework();

  if (!framework) {
    return {
      ready: false,
      reason: "DYMO framework not loaded",
      printers: []
    };
  }

  try {
    framework.init();
    const environment = framework.checkEnvironment?.();
    const printers = getDymoPrinters();

    if (!printers.length) {
      return {
        ready: false,
        reason: "No DYMO printers detected",
        environment,
        printers
      };
    }

    return {
      ready: true,
      reason: "",
      environment,
      printers
    };
  } catch (error) {
    return {
      ready: false,
      reason: error instanceof Error ? error.message : "DYMO unavailable",
      printers: []
    };
  }
}

export function printTicketWithDymo(ticket, printerName) {
  const framework = getFramework();

  if (!framework) {
    return {
      ok: false,
      reason: "DYMO framework not loaded"
    };
  }

  try {
    framework.init();

    const printers = getDymoPrinters();
    const targetPrinter =
      printerName || printers[0]?.name || "";

    if (!targetPrinter) {
      return {
        ok: false,
        reason: "No DYMO printer found"
      };
    }

    const label = framework.openLabelXml(DYMO_LABEL_XML);
    label.setAddressText(0, buildTicketLabelText(ticket));
    label.print(targetPrinter);

    return {
      ok: true,
      printerName: targetPrinter
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "DYMO print failed"
    };
  }
}
