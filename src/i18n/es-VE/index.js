// This is just an example,
// so you can safely delete all default props below
export default {
  // General
  loading: "Cargando...",
  error: "Error",
  paste: "Pegar",
  required: "Requerido",
  ok: "Ok",
  cancel: "Cancelar",
  characters: "caracteres",
  hours: "horas",
  minutes: "minutos",
  seconds: "segundos",
  fee: "comisión",
  vote: "Voto",
  please: "Por favor",
  and: "y",
  witness: "Mi Testigo en Hive",
  prices_fetched: "Precios obtenidos",
  from: "desde",
  to: "hasta",
  local_currency: "Moneda Local",
  currency: "Currency",
  confirm: "Confirm",
  yes: "Yes",
  no: "No",
  // Dark Mode Selector
  change_light: "Cambiar a modo claro",
  change_dark: "Cambiar a modo oscuro",
  // Keychain
  keychain_installed: "Keychain está instalado",
  keychain_missing: "Keychain no se encuentra",
  scan_for_keychain: "Keychain/Ecency",
  // IndexPage
  index_page_message:
    "Para obtener más información sobre este proyecto, visite",
  // Selector
  hive_account: "Usuario de Hive",
  // Lightning Page
  lightning: "Lightning",
  hive: "Hive",
  transfer: "Transferencia",
  not_found: "No encontrado",
  lightning_failed: "Lightning payment failed",
  Progress: "Progreso",
  // Login
  keychain_not_installed: "Keychain no está instalada",
  enter_hive_account: "Por favor, entre su usuario de Hive",
  hive_login: "Acceso con Hive",
  login: "Acceder",
  login_as: "Acceder como",
  login_with: "Acceder con",
  hive_keychain: "Hive Keychain",
  login_in_progress: "En proceso",
  login_failed: "Acceso fallido",
  login_success: "Acceso completado",
  sign_this: "Firma la transacción",
  matches: "coincide",
  // Get Hive
  amount: "Cantidad",
  copy: "Copiar",
  copy_qrcode: "Haga clic para copiar el código QR",
  pay: "Pagar",
  pay_tooltip: "Paga esta factura con la aplicación Lightning instalada",
  copied: "Copiado al portapapeles",
  download: "Descargar",
  download_tooltip: "Descargar el código QR como archivo",
  downloading_qrcode: "Descargando código QR",
  // SideMenu
  page: "Página",
  home: "Inicio",
  status: "Estado",
  // Status Page
  status_page_message: "Sitio en construcción, visita Hive mientras tanto.",
  // Pricebar
  sats: "satoshis (1/1000,000,000 BTC)",
  failure: "Fallo",
  working: "Trabajando",
  keychain_installed: "Keychain is Installed",
  keychain_missing: "Keychain is Missing",
  reload_prices: "Recargar precios",
  // Invoice
  invoice: "Factura",
  expires: "expira en",
  Expires: "Expira",
  enter_invoice: "lnbc.... o dirección Lightning",
  valid_invoice: "Factura descifrada",
  valid_lightning_address: "Dirección descifrada",
  invalid_invoice: "Factura o dirección Lightning inválida",
  invoice_too_low: "La factura es menor que el mínimo requerido",
  invoice_too_high: "La factura es mayor que el máximo requerido",
  invoice_expired: "La factura ha expirado",
  self_payment: "No se puede enviar a v4v.app",
  invoice_hint: "Pegue una factura o escaneé el QR",
  waiting_for: "Esperando que su transacción sea validada",
  payment_sent_hive_keychain: "Payment sent by Hive Keychain",
  check_lightning: "Check your Lightning wallet, payment has been sent",
  invoice_provider_not_working:
    "El proveedor de la factura Lightning no está funcionando ahora, intente más tarde o compruebe la dirección",
  requesting: "Solicitando",
  // HAS Process
  logged_in_as: "Conectado como",
  open_HAS_auth: "Por favor, abre tu aplicación HAS y autoriza la transacción.",
  open_HAS: "Abre tu aplicación HAS",
  which_account: "¿Qué cuenta quieres usar?",
  rejected_payment: "Pago rechazado por el usuario en HAS",
  // Please vote
  voting_as: "Votar como",
  vote_for_proposal: "Votar por la propuesta DHF",
  please_vote:
    "Si estás usando v4v.app y te es útil, considera votar nuestra propuesta para el mantenimiento y por mi testigo. Esto ayudaría mucho a mantener el servicio. ¡Muchas gracias!",
  thank_you_for_voting: "¡Gracias por votar!",
  vote_witness: "Vota por mi Testigo en Hive",
  vote_proposal: "Vota por mi propuesta a la DHF",
  thank_you: "¡Muchas gracias por haber votado!",
  // Tab Bar
  send: "Enviar",
  receive: "Recibir",
  podcasts: "Podcasts",
  pods: "Pods",
  // Ask Details dialog
  asking_details: "Estas por pagar:",
  making_invoice: "Estas por crear una factura por:",
  amount_to_send: "Cantidad a enviar",
  too_low: "La cantidad es muy baja",
  too_high: "La cantidad es muy alta",
  comment: "Comentario",
  comment_length: "El comentario es muy largo",
  // HAS Details Page
  resend_transaction: "Reintentar transacción HAS",
  payment_sent: "HAS pago enviado",
  // Camera
  NotAllowedError: "Necesitar dar permisos de acceso a tu cámara",
  NotSupportedError: "No se encuentra una cámara en este dispositivo",
  NotReadableError: "¿Está la cámara en uso?",
  OverconstrainedError: "Las camaras instaladas no están disponibles",
  StreamApiNotSupportedError:
    "La API STREAM no es soportada por este navegador",
  InsecureContextError: "Se requiere de una conexión segura (HTTPS)",
  OtherError: "Error desconocido de la cámara",
  // Explanation Box
  explanation_title: "¿Qué es este sitio?",
  explanation_text: `v4v.app actúa como una billetera de Bitcoin Lightning para Hive.\ln
  Usando el Hive o HiveBacked Dollar (HBD) de tu cuenta, puedes pagar una factura lightning o enviar satochis a cualquier dirección lightning.\ln
  En 'Enviar' puedes pagar cualquier factura lightning o enviar a una dirección lightning.\ln
  En 'Recibir' generar una factura lightning (con un código QR) para recibir sats de BTC en HIVE.\ln
  La sección 'Hive' aún esta disponible, pero se recomienda usar las secciones anteriores.\ln`,
  // Credit Card
  savings: "Ahorros",
  savings_tooltip:
    "Muestra las cantidades almacenadas en las cuentas de ahorro de HBD y Hive",
  // Transfer page
  sending: "Enviando",
  // Point of Sale POS
  point_of_sale: "Punto de venta",
  charge: "Costo",
  set_rate: "Set Rate",
  market_rate: "Market Rate",
  sales: "Sales",
  history: "History",
  // as in charge a customer
  payment: "Pago",
  scan_to_send: "Escanea este código para enviar",
  use: "Usar",
  pay_to: "Pagar a:",
  no_amount: "No se ha ingresado la cantidad",
  no_account: "No hay cuenta de Hive a la que enviar",
  old_page: "Página antigua de Hive",
  new_page: "Nueva página de recibir Hive",
  no_fees: "Sin tarifas para Hive o HBD",
  Fees: "Comisiones",
  list_received_payments: "Recibir Pagos",
  memo: "Memo",
  calculating_fees: "Calculando comisión",
  // Transaction list
  date: "Date",
  paid: "Paid",
  pending: "Pending",
  date: "Date",
  paid_by: "Paid by",
  import_hive: "Import Hive",
  local_records: "Local Records",
  import_from_hive_tooltip: "Import all past sales from Hive",
  delete_local_records_tooltip: `Delete all local records. This will erase all pending payments, \n
    but successful payments can be re- imported from Hive with the \n
    Import Hive button`,
  delete_pending_message: "Are you sure you want to delete all pending sales?",
}
