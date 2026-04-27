function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function limitText(value, maxLength) {
  const text = String(value || "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function textObject({
  name,
  text,
  x,
  y,
  width,
  height,
  fontSize,
  bold = false,
  underline = false,
  align = "Left"
}) {
  return `<ObjectInfo>
    <TextObject>
      <Name>${name}</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
      <BackColor Alpha="0" Red="255" Green="255" Blue="255" />
      <LinkedObjectName />
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <HorizontalAlignment>${align}</HorizontalAlignment>
      <VerticalAlignment>Middle</VerticalAlignment>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <UseFullFontHeight>True</UseFullFontHeight>
      <Verticalized>False</Verticalized>
      <StyledText>
        <Element>
          <String>${escapeXml(text)}</String>
          <Attributes>
            <Font Family="Arial" Size="${fontSize}" Bold="${bold ? "True" : "False"}" Italic="False" Underline="${underline ? "True" : "False"}" Strikeout="False" />
            <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />
          </Attributes>
        </Element>
      </StyledText>
    </TextObject>
    <Bounds X="${x}" Y="${y}" Width="${width}" Height="${height}" />
  </ObjectInfo>`;
}

function buildDymoLabelXml(ticket) {
  const ticketNumber = ticket.ticketNumber ? `#${ticket.ticketNumber}` : "No ticket";
  const customerName = limitText(ticket.customerName || "Customer", 34);
  const phone = ticket.phone || "No phone";
  const device = limitText(ticket.device || "No device", 32);
  const password = limitText(ticket.password ? `PW: ${ticket.password}` : "PW: none", 22);
  const issue = limitText(ticket.issue ? `Issue: ${ticket.issue}` : "Issue: no note", 56);
  const accessories = limitText(
    ticket.accessories ? `Acc: ${ticket.accessories}` : "Acc: none",
    58
  );

  return `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="twips">
  <PaperOrientation>Landscape</PaperOrientation>
  <Id>Address</Id>
  <PaperName>30252 Address</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="1581" Height="5040" Rx="270" Ry="270" />
  </DrawCommands>
  ${textObject({
    name: "TicketNumber",
    text: ticketNumber,
    x: 170,
    y: 80,
    width: 1600,
    height: 210,
    fontSize: 8,
    bold: true
  })}
  ${textObject({
    name: "CheckInDate",
    text: ticket.checkInDate || "",
    x: 3250,
    y: 80,
    width: 1600,
    height: 210,
    fontSize: 7,
    align: "Right"
  })}
  ${textObject({
    name: "CustomerName",
    text: customerName,
    x: 170,
    y: 305,
    width: 4670,
    height: 360,
    fontSize: 17,
    bold: true,
    align: "Center"
  })}
  ${textObject({
    name: "Phone",
    text: phone,
    x: 690,
    y: 675,
    width: 3650,
    height: 260,
    fontSize: 12,
    underline: true,
    align: "Center"
  })}
  ${textObject({
    name: "Device",
    text: device,
    x: 170,
    y: 955,
    width: 2650,
    height: 220,
    fontSize: 8
  })}
  ${textObject({
    name: "Password",
    text: password,
    x: 2950,
    y: 955,
    width: 1890,
    height: 220,
    fontSize: 8,
    align: "Right"
  })}
  ${textObject({
    name: "Issue",
    text: issue,
    x: 170,
    y: 1185,
    width: 4670,
    height: 185,
    fontSize: 7
  })}
  ${textObject({
    name: "Accessories",
    text: accessories,
    x: 170,
    y: 1370,
    width: 4670,
    height: 165,
    fontSize: 7
  })}
</DieCutLabel>`;
}

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
    printerType: printer.printerType || "",
    isConnected: printer.isConnected !== false,
    isLocal: printer.isLocal !== false
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
    return printers.map(normalizeDymoPrinter).filter((printer) => printer.isConnected);
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
      reason: "No connected DYMO printers detected",
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
    const labelWriter =
      printers.find((printer) => printer.printerType === "LabelWriterPrinter") || printers[0];
    const targetPrinter = printerName || labelWriter?.name || "";

    if (!targetPrinter) {
      return {
        ok: false,
        reason: "No connected DYMO printer found"
      };
    }

    const label = framework.openLabelXml(buildDymoLabelXml(ticket));
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
