
const PRODUCT_SHEET = 'Product Master';
const ORDER_SHEET = 'Orders';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ONE MART | Sales')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function doPost(e) {
  try {
    const body = JSON.parse(
      (e && e.postData && e.postData.contents) || '{}'
    );

    if (!isValidApiKey_(body.apiKey)) {
      return jsonOutput_({
        ok: false,
        error: 'Unauthorized'
      });
    }

    delete body.apiKey;

    if (body.action === 'catalog') {
      return jsonOutput_({
        ok: true,
        products: getCatalog()
      });
    }

    const result = submitOrder(body);
    return jsonOutput_(result);

  } catch (err) {
    return jsonOutput_({
      ok: false,
      error: String(err.message || err)
    });
  }
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidApiKey_(provided) {
  const saved = PropertiesService
    .getScriptProperties()
    .getProperty('ONE_MART_API_KEY');

  return !!saved && !!provided &&
    String(provided) === saved;
}

function getCatalog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(PRODUCT_SHEET);

  if (!sh) {
    throw new Error('Product Master tab not found.');
  }

  const values = sh.getDataRange().getValues();

  if (values.length < 2) return [];

  const headers = values[0].map(v => String(v).trim());
  const ix = {};

  headers.forEach((h, i) => {
    ix[h] = i;
  });

  [
    'Brand',
    'Category',
    'Model Name',
    'DP Price'
  ].forEach(h => {
    if (ix[h] === undefined) {
      throw new Error('Missing Product Master column: ' + h);
    }
  });

  return values.slice(1)
    .filter(r => {
      const active = ix['Active? (Yes/No)'] === undefined
        ? true
        : isActive_(r[ix['Active? (Yes/No)']]);

      return active &&
        String(r[ix['Model Name']] || '').trim() !== '';
    })
    .map(r => ({
      brand: String(r[ix.Brand] || '').trim(),

      category: String(r[ix.Category] || '').trim(),

      sku: ix['SKU Code'] === undefined
        ? ''
        : String(r[ix['SKU Code']] || '').trim(),

      model: String(r[ix['Model Name']] || '').trim(),

      colours: ix['Colour Options'] === undefined
        ? []
        : String(r[ix['Colour Options']] || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean),

      price: parsePrice_(r[ix['DP Price']])
    }));
}

function isActive_(value) {
  if (value === '' || value === null || value === undefined) {
    return true;
  }

  if (value === true) return true;
  if (value === false) return false;

  return ['yes', 'y', 'true', '1', 'active']
    .includes(String(value).trim().toLowerCase());
}

function parsePrice_(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0
      ? value
      : null;
  }

  const cleaned = String(value)
    .replace(/[₹,\s]/g, '');

  const price = Number(cleaned);

  return Number.isFinite(price) && price >= 0
    ? price
    : null;
}

function submitOrder(order) {
  if (!order || !Array.isArray(order.items) || !order.items.length) {
    throw new Error('Add at least one product.');
  }

  const salesman = String(order.salesman || '').trim();
  const retailer = String(order.retailer || '').trim();

  if (!salesman) throw new Error('Enter salesman name.');
  if (!retailer) throw new Error('Enter retailer / shop name.');

  if (order.items.length > 100) {
    throw new Error('Too many product lines in one order.');
  }

  // Verify every product and price against Product Master.
  const catalog = getCatalog();

  const verifiedItems = order.items.map((item, index) => {
    const qty = Number(item.qty);

    if (!Number.isInteger(qty) || qty < 1 || qty > 100000) {
      throw new Error(
        'Invalid quantity on product line ' + (index + 1) + '.'
      );
    }

    const product = catalog.find(p =>
      p.brand === String(item.brand || '').trim() &&
      p.category === String(item.category || '').trim() &&
      p.model === String(item.model || '').trim() &&
      p.sku === String(item.sku || '').trim()
    );

    if (!product) {
      throw new Error(
        'Selected product is inactive or does not match Product Master. Refresh and try again.'
      );
    }

    const colour = String(item.colour || '').trim();

    if (colour && !product.colours.includes(colour)) {
      throw new Error(
        'Invalid colour selected for ' + product.model + '.'
      );
    }

    return {
      product,
      qty,
      colour
    };
  });

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let sh = ss.getSheetByName(ORDER_SHEET);

  if (!sh) {
    sh = ss.insertSheet(ORDER_SHEET);

    sh.appendRow([
      'Order ID',
      'Submitted At',
      'Order Date',
      'Salesman Name',
      'Retailer / Shop Name',
      'Retailer Mobile',
      'Area',
      'Brand',
      'Category',
      'SKU Code',
      'Model Name',
      'Colour',
      'Qty',
      'DP Price',
      'Line Total',
      'Remarks'
    ]);

    sh.setFrozenRows(1);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const submitted = new Date();

    const orderId = 'OM-' +
      Utilities.formatDate(
        submitted,
        Session.getScriptTimeZone(),
        'yyyyMMdd-HHmmss'
      ) +
      '-' +
      Math.floor(100 + Math.random() * 900);

    const rows = verifiedItems.map(x => {
      const p = x.product;
      const price = p.price;

      return [
        orderId,
        submitted,
        order.orderDate || '',
        salesman,
        retailer,
        String(order.mobile || '').trim(),
        String(order.area || '').trim(),
        p.brand,
        p.category,
        p.sku,
        p.model,
        x.colour,
        x.qty,
        price == null ? '' : price,
        price == null ? '' : price * x.qty,
        String(order.remarks || '').trim()
      ];
    });

    sh.getRange(
      sh.getLastRow() + 1,
      1,
      rows.length,
      rows[0].length
    ).setValues(rows);

    if (sh.getLastRow() > 1) {
      sh.getRange(2, 2, sh.getLastRow() - 1, 1)
        .setNumberFormat('dd-mmm-yyyy hh:mm');

      sh.getRange(2, 14, sh.getLastRow() - 1, 2)
        .setNumberFormat('₹#,##0.00');
    }

    return {
      ok: true,
      orderId: orderId,
      lines: rows.length
    };

  } finally {
    lock.releaseLock();
  }
}
