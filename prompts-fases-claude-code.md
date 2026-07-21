# Prompts por Fase para Claude Code

## Uso de este documento

Este documento contiene un prompt independiente por cada una de las 9 fases definidas en el Development Blueprint (`blueprint-desarrollo-ai-widgets-saas.md`). Los prompts están diseñados para ejecutarse en Claude Code, en orden estricto, dentro del mismo repositorio del proyecto.

Antes de ejecutar la Fase 1, coloca el archivo `blueprint-desarrollo-ai-widgets-saas.md` en la raíz del repositorio (o en una carpeta `/docs`) para que Claude Code pueda leerlo como referencia en cada fase. Cada prompt le indica explícitamente que debe consultar ese documento antes de escribir código.

No avances a la fase siguiente hasta que la fase actual esté completa y verificada, ya que cada fase depende de las anteriores según lo especificado en la sección 18 del blueprint.

---

## Fase 1 — Fundaciones de arquitectura y base de datos

```
Actúa como Senior Full Stack Engineer y Principal Software Architect. Vas a implementar la Fase 1 de un proyecto SaaS que ya tiene su especificación técnica completa en el archivo blueprint-desarrollo-ai-widgets-saas.md, ubicado en la raíz del repositorio. Lee ese documento completo antes de escribir una sola línea de código, en particular las secciones 2 (Principios Arquitectónicos), 3 (Stack Tecnológico), 7 (Estructura de Carpetas), 15.1 a 15.6 (tablas de base de datos) y 18 Fase 1.

Objetivo de esta fase: establecer la estructura base del proyecto, la configuración de Supabase y las capas de dominio, sin funcionalidad de negocio visible todavía.

Debes:
1. Inicializar un proyecto Next.js con TypeScript en modo estricto (strict: true), Tailwind CSS y shadcn/ui, siguiendo únicamente el stack descrito en la sección 3 del blueprint. No introduzcas ninguna librería fuera de las mencionadas ahí.
2. Crear la estructura completa de carpetas descrita en la sección 7 del blueprint, incluso las carpetas que aún no tendrán contenido en esta fase (déjalas con un archivo de marcador si es necesario para que la estructura quede versionada).
3. Configurar TypeScript en modo estricto en todo el proyecto.
4. Configurar el sistema de diseño base: tokens de Tailwind, configuración de shadcn/ui, tema oscuro habilitado por defecto, tipografía y paleta de colores neutra inspirada en Vercel, Linear, Stripe y Supabase Dashboard, conforme a la sección 4 del blueprint. No implementes pantallas todavía, solo la configuración base de tokens y tema.
5. Configurar el proyecto de Supabase: autenticación (Supabase Auth) y conexión del cliente de Supabase al proyecto Next.js.
6. Implementar en /domain/entities las entidades de dominio puras correspondientes a Organización, Usuario, Miembro de Organización, Rol y Equipo, sin ninguna dependencia de Next.js, Supabase ni ningún SDK externo, conforme al principio de Clean Architecture de la sección 2.1.
7. Definir en /domain/repositories-interfaces las interfaces de repositorio para estas entidades (sin implementación concreta todavía), respetando el principio de inversión de dependencias de la sección 2.2.
8. Crear en Supabase (mediante migraciones versionadas) las tablas descritas en las secciones 15.1 a 15.6 del blueprint: organizations, users, organization_members, roles, teams, team_widgets, con exactamente los campos, tipos, índices y restricciones especificados. Implementa las políticas RLS descritas para cada tabla, incluyendo la función de seguridad centralizada que verifica la pertenencia de un usuario a una organización, mencionada en la sección 15.23.
9. No implementes ninguna pantalla del dashboard, ningún endpoint funcional ni ningún caso de uso todavía; esta fase es exclusivamente de fundación.

Al finalizar, entrega un resumen de: estructura de carpetas creada, entidades de dominio implementadas, migraciones aplicadas y políticas RLS activas. No avances a la Fase 2 sin confirmación.
```

---

## Fase 2 — Autenticación, organizaciones y gestión de usuarios y equipos

```
Actúa como Senior Full Stack Engineer. Vas a implementar la Fase 2 del proyecto especificado en blueprint-desarrollo-ai-widgets-saas.md. La Fase 1 ya está completa (estructura de carpetas, configuración base, entidades de dominio de identidad y tablas organizations, users, organization_members, roles, teams, team_widgets). Antes de escribir código, relee las secciones 2, 4, 8, 9.6 a 9.9 y 18 Fase 2 del blueprint.

Objetivo de esta fase: habilitar el flujo completo de registro, inicio de sesión, gestión de organización, usuarios, roles y equipos dentro del dashboard.

Debes:
1. Implementar las rutas de autenticación (/app/(auth)/iniciar-sesion, /registro, /recuperar-password) usando Supabase Auth, con toda la interfaz de usuario en español de Latinoamérica, sin emojis, usando exclusivamente componentes shadcn/ui e iconografía Lucide Icons, conforme a la sección 4.
2. Implementar los componentes reutilizables base descritos en la sección 8 que aún no existan: Sidebar, Navbar, Card, Avatar, Badge, Tabs, Input, Select, Button, Modal, Drawer. Cada componente debe ser agnóstico de datos, recibiendo únicamente props tipadas.
3. Implementar el layout del dashboard (/app/(dashboard)) con la barra lateral de navegación que incluya todas las secciones descritas en la sección 9 del blueprint (aunque algunas aún no tengan contenido funcional, deben existir como rutas placeholder para fases posteriores).
4. Implementar los hooks de sesión autenticada, organización activa y permisos por rol, ubicados en /hooks, siguiendo la arquitectura de capas: los hooks consumen servicios de /services, nunca acceden directamente a Supabase desde componentes de UI.
5. Implementar en /services los servicios de gestión de usuarios, gestión de equipos y gestión de organización, que a su vez consumen las interfaces de repositorio definidas en la Fase 1 mediante implementaciones concretas en /infrastructure/supabase/repositories.
6. Implementar los endpoints /api/v1/auth, /api/v1/organizations, /api/v1/users, /api/v1/teams conforme a la sección 16 del blueprint, incluyendo el middleware de autenticación y el middleware de autorización por rol descritos en 16.3.
7. Implementar completamente las pantallas Usuarios (9.6), Equipos (9.7), Configuración (9.8) y Perfil (9.9) tal como están descritas: objetivo, componentes, flujo, acciones disponibles, estados y navegación exactos de cada una.
8. No implementes widgets, proveedores de IA ni integraciones n8n en esta fase.

Al finalizar, entrega un resumen de las pantallas implementadas, los endpoints funcionales y confirma que las políticas RLS de la Fase 1 se respetan correctamente desde el nuevo código (ningún usuario puede ver datos de otra organización). No avances a la Fase 3 sin confirmación.
```

---

## Fase 3 — Módulo de proveedores de inteligencia artificial

```
Actúa como Senior Full Stack Engineer y AI Engineer. Vas a implementar la Fase 3 del proyecto especificado en blueprint-desarrollo-ai-widgets-saas.md. Las Fases 1 y 2 ya están completas. Antes de escribir código, relee en profundidad las secciones 5 (Arquitectura de Adaptadores para Proveedores de IA), 9.4, 11, 15.11, 15.12 y 18 Fase 3 del blueprint. Esta fase es arquitectónicamente crítica: define el patrón de adaptadores que el resto del sistema debe respetar.

Objetivo de esta fase: implementar la interfaz AIProvider, sus adaptadores concretos para OpenAI y Anthropic, y la pantalla de gestión de proveedores.

Debes:
1. Definir en /domain la interfaz AIProvider exactamente con las capacidades descritas en la sección 5.1: validación de credenciales, envío de mensajes con soporte de streaming y respuesta completa, especificación de parámetros del modelo, normalización de respuesta a un formato interno único, normalización de errores a un conjunto interno, y reporte de consumo de tokens. Esta interfaz no debe importar ningún SDK de OpenAI ni Anthropic.
2. Implementar en /providers/ai/openai el adaptador OpenAIProviderAdapter y en /providers/ai/anthropic el adaptador AnthropicProviderAdapter, cada uno implementando la interfaz AIProvider y siendo el único punto del sistema que conoce los detalles del SDK o API HTTP del proveedor correspondiente, conforme a la sección 5.2.
3. Implementar en /providers/ai/factory la AIProviderFactory que instancia el adaptador correcto en tiempo de ejecución según la configuración del widget, conforme a la sección 5.3. Ningún caso de uso debe instanciar un adaptador directamente; siempre debe solicitarlo a la fábrica.
4. Verifica de forma explícita el cumplimiento del principio de sustitución de Liskov y el principio abierto/cerrado: cualquier caso de uso que consuma AIProvider debe funcionar de forma idéntica sin importar qué adaptador concreto reciba de la fábrica, y agregar un proveedor futuro no debe requerir modificar ningún caso de uso existente.
5. Crear en Supabase las tablas provider_configs y provider_usage_logs exactamente como se describen en las secciones 15.11 y 15.12, incluyendo el cifrado del campo de credenciales y las políticas RLS que impiden exponer credenciales en texto plano a través de vistas de lectura general.
6. Implementar el servicio de validación de credenciales, el servicio de registro de consumo y tokens, y el manejo de errores clasificado (autenticación, límite de uso, contenido, disponibilidad, desconocido) descrito en la sección 11.
7. Implementar el endpoint /api/v1/providers conforme a la sección 16.4, incluyendo listado de modelos disponibles por proveedor y consulta de consumo.
8. Implementar completamente la pantalla Proveedores IA (sección 9.4) con el componente Provider Selector descrito en la sección 8, incluyendo todos sus estados: proveedor no configurado, credenciales pendientes de validación, credenciales válidas, credenciales inválidas o expiradas.
9. No implementes widgets ni integraciones n8n en esta fase.

Al finalizar, entrega un resumen de la interfaz AIProvider implementada, confirma que ningún archivo fuera de /providers/ai/openai y /providers/ai/anthropic importa un SDK de proveedor de IA, y describe cómo se validó la intercambiabilidad de ambos adaptadores. No avances a la Fase 4 sin confirmación.
```

---

## Fase 4 — Gestión completa de widgets y personalización visual

```
Actúa como Senior Full Stack Engineer y UX/UI Designer. Vas a implementar la Fase 4 del proyecto especificado en blueprint-desarrollo-ai-widgets-saas.md. Las Fases 1, 2 y 3 ya están completas. Antes de escribir código, relee en profundidad las secciones 4, 8, 9.2, 10 y 18 Fase 4 del blueprint.

Objetivo de esta fase: implementar la creación, configuración general, apariencia, dominios y horarios de los widgets, junto con la previsualización en vivo.

Debes:
1. Crear en Supabase las tablas widgets, widget_appearance, widget_domains y widget_schedules exactamente como se describen en las secciones 15.7 a 15.10, con todos sus campos, índices, restricciones de eliminación en cascada y políticas RLS.
2. Implementar en /domain las entidades de dominio Widget, ApariciaDeWidget (apariencia), DominioDeWidget y HorarioDeWidget, y sus interfaces de repositorio correspondientes.
3. Implementar en /services el servicio de gestión de widgets, el servicio de gestión de apariencia y el servicio de gestión de dominios y horarios, consumiendo las interfaces de repositorio mediante implementaciones concretas en /infrastructure/supabase/repositories.
4. Implementar los componentes reutilizables Widget Preview, Theme Editor y Color Picker descritos en la sección 8, con la previsualización en vivo sincronizada mediante el hook de estado de configuración de widget en edición.
5. Implementar completamente la pantalla Widgets (sección 9.2) y todas sus subsecciones dentro del detalle de cada widget: General, Apariencia, Proveedor (reutilizando el Provider Selector de la Fase 3), Integraciones (solo la estructura de la pestaña; la lógica de integraciones llega en la Fase 5), Dominios y Avanzado.
6. Implementa cada uno de los campos de configuración descritos exhaustivamente en la sección 10 del blueprint: identificación y estado, todos los campos de apariencia (tema, colores, tipografía, header, footer, mensaje inicial, mensajes sugeridos, posición, tamaño, border radius, sombras, espaciados, animaciones, botón flotante, copyright, powered by, enlace inferior, idioma), restricciones de publicación (dominios permitidos, horarios) y configuración avanzada.
7. Implementar el endpoint /api/v1/widgets conforme a la sección 16.4, incluyendo sus subrutas de apariencia, dominios y horarios, con los métodos GET, POST, PATCH y DELETE correspondientes a creación, listado, detalle, actualización, cambio de estado (borrador, publicado, pausado, archivado), eliminación y duplicación.
8. Asegúrate de que la publicación de un widget valide que tenga un provider_config_id asociado y válido, conforme a la restricción de la sección 15.7.
9. No implementes integraciones n8n funcionales, el widget embebible público ni el generador de snippet en esta fase; esos llegan en las Fases 5 y 6.

Al finalizar, entrega un resumen de las pantallas y subsecciones implementadas, y confirma que la previsualización en vivo refleja fielmente cada cambio de configuración antes de guardar. No avances a la Fase 5 sin confirmación.
```

---

## Fase 5 — Módulo de integraciones n8n

```
Actúa como Senior Full Stack Engineer. Vas a implementar la Fase 5 del proyecto especificado en blueprint-desarrollo-ai-widgets-saas.md. Las Fases 1 a 4 ya están completas. Antes de escribir código, relee en profundidad las secciones 6 (Módulo de Integración con n8n), 9.5, 15.13 a 15.15 y 18 Fase 5 del blueprint.

Objetivo de esta fase: implementar la configuración de integraciones de n8n mediante Webhooks y su asociación con widgets.

Debes:
1. Crear en Supabase las tablas n8n_integrations, widget_integrations e integration_execution_logs exactamente como se describen en las secciones 15.13 a 15.15, incluyendo el cifrado de credenciales de autenticación del Webhook y las políticas RLS correspondientes.
2. Implementar en /providers/n8n el servicio N8nIntegrationService, responsable de: construir la solicitud HTTP a partir de la configuración interpolando las variables dinámicas, ejecutar la solicitud aplicando timeout y la política de reintentos configurada, registrar cada ejecución (éxito, fallo, tiempo de respuesta, código de estado) en integration_execution_logs, y normalizar la respuesta o el error hacia quien lo invoque, conforme a la sección 6.6.
3. Implementa el soporte completo de configuración descrito en la sección 6.2: URL del Webhook, método HTTP, encabezados personalizados, autenticación (sin autenticación, cabecera estática, token, básica), variables dinámicas, timeout, política de reintentos, política de manejo de errores y definición del formato de respuesta esperado.
4. Implementa la construcción del payload normalizado descrito en la sección 6.4 (usuario, sesión, conversación, historial, mensaje actual, variables personalizadas, metadata, dominio, widget, organización, fecha y hora), aunque en esta fase el disparo real desde una conversación en vivo del widget se validará mediante un mecanismo de prueba de conexión, ya que el flujo conversacional completo se implementa en la Fase 6.
5. Implementar el endpoint /api/v1/integrations conforme a la sección 16.4, incluyendo creación, listado, actualización, prueba de conexión, eliminación, y asociación/desasociación con widgets. Implementar también /api/v1/webhook para el disparo de pruebas de conexión desde el dashboard.
6. Implementar completamente la pantalla Integraciones n8n (sección 9.5), incluyendo el formulario completo de configuración del Webhook, el panel de pruebas de conexión y el registro de ejecuciones recientes.
7. Implementar la sección Integraciones dentro del detalle de cada widget (referenciada como pendiente en la Fase 4), permitiendo asociar una o varias integraciones existentes, definir el punto de disparo (antes del proveedor de IA, después del proveedor de IA, acción independiente) y el orden de ejecución, conforme a la tabla widget_integrations.
8. No implementes el disparo de integraciones dentro de una conversación real del widget embebido en esta fase; eso corresponde al caso de uso de procesamiento conversacional de la Fase 6.

Al finalizar, entrega un resumen de las integraciones probadas exitosamente mediante el panel de pruebas de conexión, y confirma que ninguna credencial de autenticación del Webhook queda expuesta en texto plano en ningún registro ni respuesta de API. No avances a la Fase 6 sin confirmación.
```

---

## Fase 6 — Snippet, widget embebible y flujo conversacional

```
Actúa como Senior Full Stack Engineer y AI Engineer. Vas a implementar la Fase 6 del proyecto especificado en blueprint-desarrollo-ai-widgets-saas.md. Las Fases 1 a 5 ya están completas. Esta es la fase más crítica del proyecto: relee en profundidad, antes de escribir código, las secciones 12 (Widget Embebible, incluyendo 12.4 Registro Persistente de Conversaciones y 12.5 Captura y Persistencia de la Identidad del Visitante), 13 (Generador de Snippet), 15.16 a 15.18, 15.21, 16 (Especificación de la API), 17 (Flujo Técnico Integral) y 18 Fase 6 del blueprint.

Objetivo de esta fase: implementar el generador de snippet, el script del cargador, el runtime del widget embebible y el flujo conversacional completo, orquestando el proveedor de IA configurado y las integraciones de n8n asociadas, con registro persistente de cada conversación y captura del nombre del visitante cuando esté disponible.

Regla arquitectónica no negociable: el widget embebible (todo lo que se ejecuta en el navegador del visitante, en /widget-client) nunca debe comunicarse directamente con OpenAI, Anthropic ni ningún endpoint de n8n. Toda comunicación externa al backend de la plataforma queda terminantemente prohibida dentro de /widget-client.

Debes:
1. Crear en Supabase las tablas snippets, sessions, conversations y messages exactamente como se describen en las secciones 15.16 a 15.18 y 15.21, incluyendo los campos visitor_name en sessions y conversations descritos en la actualización de esas secciones, con sus políticas RLS, incluyendo que la escritura de sessions, conversations y messages solo puede realizarse mediante funciones de servidor invocadas desde la API pública del widget, nunca desde el cliente directamente.
2. Implementar en /services el servicio de generación de snippet y el servicio de configuración pública del widget, conforme a la sección 13: generación de un identificador único asociado al widget, endpoint público que valida el dominio de origen contra widget_domains antes de devolver configuración, y verificación de que el widget está en estado publicado y dentro del horario permitido (widget_schedules) antes de responder.
3. Implementar el endpoint público /api/v1/snippet (obtención de configuración pública), /api/v1/sessions (inicialización y renovación de sesión) y /api/v1/messages (envío de mensaje y respuesta, con soporte de streaming) conforme a la sección 16.4, protegidos por el middleware de validación de dominio y el middleware de límite de solicitudes descritos en 16.3, sin exigir autenticación de usuario.
4. Implementar en /domain/use-cases el caso de uso de procesamiento conversacional, que debe: recibir el mensaje del visitante, construir el contexto de conversación según la configuración de manejo de sesiones del widget, invocar (cuando corresponda según widget_integrations) el N8nIntegrationService de la Fase 5 en el punto de disparo configurado, invocar el AIProvider correcto mediante la AIProviderFactory de la Fase 3, combinar o encadenar las respuestas según la configuración del flujo, y persistir de forma inmediata (no diferida) la conversación y cada mensaje intercambiado en ese mismo turno, conforme a la sección 12.4 del blueprint.
5. Dentro del mismo caso de uso de procesamiento conversacional, implementar el mecanismo de captura de identidad del visitante descrito en la sección 12.5: tras persistir cada intercambio, evaluar si el mensaje del visitante contiene su nombre en respuesta a una solicitud previa del asistente, usando el mismo AIProvider configurado como mecanismo de extracción. Si se determina un nombre con confianza suficiente, actualizar de inmediato el campo visitor_name en sessions y en conversations, y propagarlo a conversaciones posteriores de la misma sesión salvo que el visitante proporcione un nombre distinto. Implementar también la vía de identificación explícita: el endpoint de inicialización de sesión (/api/v1/sessions) debe aceptar de forma opcional datos de identificación ya conocidos por el sitio anfitrión y persistirlos directamente sin pasar por el mecanismo de inferencia.
6. Implementar en la pantalla de detalle del widget o en un mecanismo administrativo accesible desde el Historial (a completar visualmente en la Fase 7) la capacidad de eliminar el visitor_name almacenado de una sesión o conversación específica sin eliminar sus mensajes, conforme a la sección 12.5.
7. Implementar en /widget-client el script del cargador (loader) y el runtime del widget, siguiendo exactamente el flujo técnico descrito en la sección 17 (ahora de veintiún pasos, incluyendo el paso 21 de captura de identidad) y el detalle específico del flujo del widget en la sección 12.2: descarga asíncrona del script, lectura del identificador del widget desde el snippet, solicitud de configuración pública, validación de dominio en el backend, inyección del contenedor del widget con encapsulamiento de estilos, inicialización o recuperación de sesión (incluyendo el envío opcional de datos de identificación ya conocidos por el sitio anfitrión), renderizado del launcher, apertura de la ventana con mensaje inicial y mensajes sugeridos, envío de mensajes, recepción de respuesta en streaming, renderizado progresivo.
8. Implementar en el widget embebible todos los elementos funcionales descritos en la sección 12.1: Launcher, Ventana, Header, Avatar, Estado, Conversación, Streaming, renderizado de Markdown, código con resaltado de sintaxis, tablas, listas, enlaces con apertura segura, scroll automático, diseño responsive, atributos de accesibilidad, modo oscuro y aplicación del tema personalizado configurado en la Fase 4.
9. Implementar completamente el componente Snippet Generator descrito en la sección 8, integrado en la pantalla de detalle del widget, con función de copiado del fragmento generado.
10. Verifica de forma explícita, antes de finalizar la fase, que no existe ninguna importación de un SDK de OpenAI, Anthropic ni ninguna llamada HTTP directa a un dominio de n8n dentro de la carpeta /widget-client.

Al finalizar, entrega un resumen del flujo end-to-end probado: creación de snippet, inserción en una página de prueba, carga del widget, envío de un mensaje, verificación de que la conversación quedó persistida de inmediato en la base de datos, prueba de una conversación en la que el asistente pregunta el nombre del visitante y este responde, confirmando que visitor_name queda correctamente actualizado en sessions y conversations, ejecución de una integración de n8n asociada (si aplica) y recepción de la respuesta renderizada. No avances a la Fase 7 sin confirmación.
```

---

## Fase 7 — Analíticas, logs e historial

```
Actúa como Senior Full Stack Engineer y Data Engineer. Vas a implementar la Fase 7 del proyecto especificado en blueprint-desarrollo-ai-widgets-saas.md. Las Fases 1 a 6 ya están completas y existen conversaciones y mensajes reales generados por el flujo del widget embebible. Antes de escribir código, relee en profundidad las secciones 8, 9.3, 9.11, 9.12, 14, 15.19, 15.20 y 18 Fase 7 del blueprint.

Objetivo de esta fase: implementar el registro y la presentación de métricas de uso, eventos del sistema e historial de conversaciones.

Debes:
1. Crear en Supabase las tablas analytics_daily y events exactamente como se describen en las secciones 15.19 y 15.20, con sus índices y políticas RLS.
2. Implementar el servicio de agregación de analíticas, que calcule y persista en analytics_daily, por widget y por día, todas las métricas descritas en la sección 14: usuarios únicos, conversaciones iniciadas, mensajes enviados y recibidos, tiempo promedio de respuesta, errores, latencia, tokens consumidos (entrada y salida), consumo desagregado por proveedor, retroalimentación y calificaciones.
3. Implementar el servicio de registro de eventos, que capture eventos técnicos relevantes (publicación de widget, fallo de integración n8n, error de proveedor de IA, y cualquier otro evento significativo del sistema) en la tabla events, clasificados por severidad (información, advertencia, error, crítico) y origen (widget, proveedor, integración n8n, sistema).
4. Implementar los componentes Analytics Chart y Conversation Viewer descritos en la sección 8.
5. Implementar completamente la pantalla Analíticas (sección 9.3), con selector de widget y de rango de fechas, gráficos de series de tiempo, tarjetas de métricas agregadas y tabla de calificaciones y retroalimentación, permitiendo profundizar desde una métrica hasta el detalle de una conversación individual mediante el Conversation Viewer.
6. Implementar completamente la pantalla Logs (sección 9.11), con filtros por tipo, severidad y widget, y acceso al detalle de cada evento.
7. Implementar completamente la pantalla Historial (sección 9.12), con filtros por widget, fecha, resultado (completada, abandonada, con error) y nombre del visitante, mostrando en el listado el nombre del visitante cuando esté disponible (por ejemplo, "Conversación con [nombre]") o un identificador técnico legible cuando no lo esté, y acceso al detalle completo de cualquier conversación mediante el Conversation Viewer, el cual debe mostrar el nombre del visitante en el encabezado del hilo cuando corresponda.
8. Implementar en la pantalla Historial la acción de eliminar el nombre almacenado (visitor_name) de una conversación o sesión específica sin eliminar sus mensajes, conforme a la sección 12.5, disponible únicamente para roles con permisos administrativos.
9. Implementar el endpoint /api/v1/analytics, el endpoint /api/v1/logs y el endpoint /api/v1/conversations conforme a la sección 16.4, incluyendo en /api/v1/conversations el soporte de búsqueda por visitor_name y el endpoint de eliminación del nombre almacenado.

Al finalizar, entrega un resumen de las métricas verificadas contra datos reales generados en la Fase 6 (al menos una conversación completa debe reflejarse correctamente en Analíticas, Historial y, si generó algún evento relevante, en Logs), y confirma explícitamente que una conversación de prueba en la que el visitante proporcionó su nombre aparece en el Historial etiquetada con dicho nombre y es localizable mediante la búsqueda por nombre. No avances a la Fase 8 sin confirmación.
```

---

## Fase 8 — Facturación y almacenamiento

```
Actúa como Senior Full Stack Engineer. Vas a implementar la Fase 8 del proyecto especificado en blueprint-desarrollo-ai-widgets-saas.md. Las Fases 1 a 7 ya están completas. Antes de escribir código, relee en profundidad las secciones 9.10, 15.22 y 18 Fase 8 del blueprint. Recuerda que esta pantalla se aborda exclusivamente desde una perspectiva de datos técnicos de consumo registrado por el sistema, sin ningún contenido comercial, de precios ni de negocio.

Objetivo de esta fase: completar la pantalla Facturación desde la perspectiva de consumo técnico registrado, y formalizar la gestión de archivos mediante Supabase Storage.

Debes:
1. Crear en Supabase la tabla storage_assets exactamente como se describe en la sección 15.22, con sus índices y políticas RLS.
2. Implementar el servicio de gestión de assets, que registre en storage_assets cada archivo subido a Supabase Storage (logos y avatares de widgets, avatares de usuario), asociándolo a la organización y, cuando corresponda, al widget.
3. Verifica y, si es necesario, completa la integración de subida de archivos en las pantallas donde se configuran logos y avatares (pantalla Widgets de la Fase 4 y pantalla Perfil de la Fase 2), asegurando que cada subida quede trazada en storage_assets.
4. Implementar el servicio de agregación de consumo para facturación, que reutilice los datos de provider_usage_logs (Fase 3) y analytics_daily (Fase 7) para presentar el consumo técnico agregado por organización, por widget y por proveedor, en períodos configurables.
5. Implementar completamente la pantalla Facturación (sección 9.10): resumen del plan activo, historial de períodos, detalle de consumo por widget y por proveedor, con las acciones de ver detalle de consumo y descargar historial.
6. Reutiliza los endpoints /api/v1/providers y /api/v1/analytics existentes para exponer los datos de consumo requeridos por esta pantalla; no dupliques lógica de agregación ya implementada en fases anteriores.

Al finalizar, entrega un resumen de la trazabilidad de archivos verificada (cada logo o avatar subido durante pruebas debe aparecer en storage_assets) y confirma que la pantalla Facturación no contiene ningún texto de naturaleza comercial, de precios o de planes de venta, únicamente datos de consumo técnico. No avances a la Fase 9 sin confirmación.
```

---

## Fase 9 — Consolidación, seguridad y extensibilidad

```
Actúa como Principal Software Architect y responsable de seguridad. Vas a implementar la Fase 9, última fase, del proyecto especificado en blueprint-desarrollo-ai-widgets-saas.md. Las Fases 1 a 8 ya están completas y la plataforma es funcional de extremo a extremo. Antes de realizar cualquier cambio, relee el blueprint completo una vez más, con énfasis en las secciones 2, 5, 15.23 y 18 Fase 9.

Objetivo de esta fase: verificar el cumplimiento estricto de la arquitectura de adaptadores, las políticas de seguridad a nivel de fila, y preparar el sistema para la incorporación futura de nuevos proveedores de inteligencia artificial sin modificar el núcleo de la plataforma. Esta fase no introduce funcionalidad nueva visible; es una auditoría técnica exhaustiva con correcciones donde sea necesario.

Debes:
1. Recorrer todo el código de /domain y /services y confirmar que ninguna capa interna importa Next.js, el SDK de Supabase, ni SDKs de OpenAI, Anthropic o n8n directamente. Documenta y corrige cualquier violación encontrada.
2. Recorrer /providers/ai y confirmar que la interfaz AIProvider sigue siendo el único contrato consumido fuera de esa carpeta, que la AIProviderFactory es el único punto de instanciación de adaptadores, y que un proveedor hipotético nuevo podría añadirse creando únicamente un nuevo adaptador y registrándolo en la fábrica, sin tocar casos de uso, controladores ni componentes de UI genéricos. Redacta una verificación explícita de este punto (sin implementar un proveedor nuevo real).
3. Recorrer todas las tablas listadas en la sección 15 del blueprint y verificar, una por una, que: la política RLS está habilitada, que ningún usuario puede leer o escribir datos fuera de su organización, que los campos de credenciales cifradas nunca se exponen en ninguna vista ni respuesta de API, y que los endpoints públicos del widget (configuración, sesión, mensajes) solo acceden a datos mediante funciones de servidor con las validaciones de dominio y estado descritas en la sección 15.23. Corrige cualquier política faltante o incorrecta.
4. Verifica que todos los índices y restricciones descritos en la sección 15 para cada tabla están efectivamente creados en la base de datos, no solo documentados.
5. Revisa el versionado de la API (prefijo /api/v1) y confirma que la estructura uniforme de errores descrita en la sección 16.5 se aplica de forma consistente en todos los grupos de endpoints, incluidos los errores originados en proveedores de IA e integraciones de n8n, que nunca deben exponer detalles internos del servicio externo.
6. Revisa el middleware de límite de solicitudes tanto en endpoints administrativos como públicos y confirma que están aplicados de forma consistente en toda la API.
7. Revisa que ninguna parte de /widget-client contiene comunicación directa con OpenAI, Anthropic o n8n, reconfirmando el hallazgo de la Fase 6.
8. Revisa que toda la interfaz del dashboard y del widget embebible mantiene el idioma español de Latinoamérica con ortografía correcta y tildes, ausencia total de emojis, y uso exclusivo de iconografía Lucide Icons en formato SVG, conforme a la sección 4.

Al finalizar, entrega un informe de auditoría estructurado con: hallazgos encontrados, correcciones aplicadas, y una declaración explícita de cumplimiento de cada principio arquitectónico de la sección 2 y de la arquitectura de adaptadores de la sección 5. Este informe cierra el desarrollo de la plataforma conforme al blueprint.
```
