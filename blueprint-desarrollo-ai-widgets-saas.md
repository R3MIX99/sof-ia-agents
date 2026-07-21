# Development Blueprint — Plataforma SaaS de AI Widgets Embebibles

## Documento de especificación técnica oficial

Este documento constituye la fuente única de verdad para el desarrollo completo de la plataforma. Está dirigido exclusivamente a un equipo o sistema de inteligencia artificial encargado de implementar el producto. No contiene código, ejemplos de implementación, estimaciones, costos ni contenido comercial. Todo el contenido es de naturaleza técnica y arquitectónica.

---

## 1. Visión Técnica General

La plataforma permite a un usuario autenticado crear, configurar, personalizar y publicar múltiples widgets de inteligencia artificial embebibles en sitios web de terceros mediante un snippet de JavaScript. Cada widget se conecta, a través del backend de la plataforma, a un proveedor de inteligencia artificial (OpenAI o Anthropic) y, opcionalmente, a uno o varios flujos de automatización construidos en n8n.

El principio arquitectónico fundamental es que el widget embebido nunca contiene lógica de negocio, claves de API, ni conocimiento directo de los proveedores de inteligencia artificial. El widget es exclusivamente una capa de presentación que se comunica únicamente con la API del backend de la plataforma mediante HTTPS. El backend actúa como intermediario obligatorio entre el widget, los proveedores de IA y los flujos de n8n.

La plataforma se organiza en tres superficies claramente separadas:

1. **Dashboard administrativo**: aplicación Next.js protegida por autenticación, donde los usuarios gestionan organizaciones, widgets, proveedores, integraciones, analíticas y configuración.
2. **API del backend**: conjunto de Route Handlers de Next.js que exponen endpoints para el dashboard y para el widget embebido, y que contienen toda la lógica de negocio, orquestación de proveedores de IA y ejecución de flujos de n8n.
3. **Widget embebible**: script JavaScript ligero, servido públicamente, que se inserta en sitios de terceros y renderiza la interfaz conversacional, comunicándose exclusivamente con la API del backend.

---

## 2. Principios Arquitectónicos Obligatorios

### 2.1 Clean Architecture

El sistema se organiza en capas concéntricas con dependencias unidireccionales hacia el centro:

- **Capa de dominio (Entities/Domain)**: contiene las entidades de negocio puras (Widget, Organización, Proveedor, Conversación, Mensaje, Integración, Sesión) y las reglas de negocio que no dependen de ningún framework, base de datos ni proveedor externo. No importa Next.js, Supabase ni SDKs de terceros.
- **Capa de casos de uso (Use Cases / Application)**: contiene la lógica de orquestación de cada operación del sistema (crear widget, publicar widget, enviar mensaje, ejecutar flujo n8n, consultar analíticas). Depende únicamente de interfaces (puertos), nunca de implementaciones concretas.
- **Capa de adaptadores (Interface Adapters)**: implementaciones concretas de las interfaces definidas en la capa de casos de uso. Aquí residen los adaptadores de proveedores de IA (OpenAIProviderAdapter, AnthropicProviderAdapter), el adaptador de n8n, los repositorios que implementan el acceso a Supabase, y los controladores de los Route Handlers.
- **Capa de infraestructura (Frameworks & Drivers)**: Next.js, Supabase SDK, clientes HTTP, configuración de despliegue en Vercel.

Ninguna capa interna puede depender de una capa externa. La capa de dominio y la capa de casos de uso no deben importar nada de Supabase, Next.js ni SDKs de proveedores de IA.

### 2.2 Principios SOLID

- **Responsabilidad única**: cada clase, módulo o función tiene una única razón de cambio. Los servicios de proveedores, los repositorios de datos y los controladores de API están completamente separados.
- **Abierto/cerrado**: el sistema permite añadir nuevos proveedores de IA o nuevos tipos de integraciones sin modificar el código existente, únicamente agregando nuevos adaptadores que implementan las interfaces establecidas.
- **Sustitución de Liskov**: cualquier implementación de `AIProvider` debe poder sustituir a otra sin alterar el comportamiento esperado por los casos de uso que la consumen.
- **Segregación de interfaces**: las interfaces se definen de forma granular (por ejemplo, una interfaz para envío de mensajes, otra para validación de credenciales, otra para registro de consumo) evitando interfaces monolíticas.
- **Inversión de dependencias**: los módulos de alto nivel (casos de uso) dependen de abstracciones (interfaces), y las implementaciones concretas se inyectan en tiempo de ejecución mediante un contenedor de dependencias o factorías.

### 2.3 DRY, KISS y Modularidad

Toda lógica repetida se extrae a utilidades, hooks o servicios compartidos. Cada módulo resuelve una única responsabilidad funcional y expone una interfaz clara hacia el resto del sistema. Se prohíbe la duplicación de lógica de validación, formateo o transformación entre frontend y backend; dicha lógica debe residir en paquetes compartidos de tipos y esquemas de validación.

### 2.4 Tipado estricto

Todo el proyecto se desarrolla en TypeScript en modo estricto (`strict: true`). Se prohíbe el uso de `any` implícito. Todas las entidades de dominio, DTOs de la API, payloads de webhooks y configuraciones de widgets deben tener tipos e interfaces explícitas, centralizadas en un módulo de tipos compartido.

---

## 3. Stack Tecnológico

La plataforma se construye exclusivamente con las siguientes tecnologías, sin excepción:

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons.
- **Backend**: Next.js Route Handlers, TypeScript.
- **Base de datos**: Supabase PostgreSQL.
- **Autenticación**: Supabase Auth.
- **Almacenamiento**: Supabase Storage.
- **Tiempo real**: Supabase Realtime, utilizado únicamente en los casos estrictamente necesarios (por ejemplo, actualización en vivo del estado de una conversación dentro del dashboard).
- **Control de versiones**: GitHub.
- **Despliegue**: Vercel.

No se introduce ningún framework de gestión de estado adicional, ORM externo, ni servicio de terceros fuera de los mencionados. El acceso a datos se realiza mediante el cliente de Supabase y, cuando corresponda, mediante funciones SQL y vistas definidas en la propia base de datos.

---

## 4. Reglas de Diseño de Interfaz

La interfaz visual se inspira en los lenguajes de diseño de Vercel, Linear, Stripe y Supabase Dashboard. Debe cumplir los siguientes lineamientos obligatorios:

- Estilo minimalista, profesional, moderno y elegante.
- Modo oscuro habilitado por defecto en todo el dashboard y en el widget (con posibilidad de modo claro configurable por el usuario final del widget).
- Prohibido el uso de emojis en cualquier parte de la interfaz.
- Toda la iconografía debe implementarse exclusivamente mediante Lucide Icons, en formato SVG.
- Todo el texto visible de la interfaz debe redactarse en español de Latinoamérica, con ortografía correcta, incluyendo tildes y acentos en todas las palabras que los requieran. Se prohíben las traducciones literales del inglés; los textos deben sonar naturales en español.
- La densidad visual debe ser baja, con espaciados generosos, jerarquía tipográfica clara y uso de color limitado a acentos funcionales (estados, acciones primarias, alertas).
- Los componentes deben mantener consistencia visual estricta en toda la aplicación mediante el sistema de diseño de shadcn/ui y tokens de Tailwind CSS centralizados (colores, radios de borde, sombras, tipografía).

---

## 5. Arquitectura de Adaptadores para Proveedores de IA

### 5.1 Interfaz `AIProvider`

Se define una interfaz de dominio llamada `AIProvider` que constituye el único contrato reconocido por el resto del sistema para interactuar con cualquier proveedor de inteligencia artificial. Ningún módulo de casos de uso, controlador de API ni componente de frontend puede depender directamente de un SDK de OpenAI o Anthropic.

La interfaz `AIProvider` debe declarar, de forma abstracta y sin detalles de implementación, las siguientes capacidades:

- Validación de credenciales del proveedor.
- Envío de un mensaje o secuencia de mensajes de conversación, con soporte para respuesta en modo streaming y en modo respuesta completa.
- Especificación de parámetros del modelo (modelo seleccionado, temperatura, tokens máximos, penalizaciones, mensajes de sistema, herramientas o funciones si el proveedor las soporta).
- Normalización de la respuesta del proveedor a un formato interno único de la plataforma, independiente del formato nativo de cada proveedor.
- Normalización de errores del proveedor a un conjunto de errores internos de la plataforma (error de autenticación, error de límite de uso, error de disponibilidad, error de contenido, error desconocido).
- Reporte de consumo de tokens (entrada, salida, total) y metadatos de uso asociados a cada solicitud.

### 5.2 Adaptadores concretos

Se implementan dos adaptadores concretos en la primera versión:

- **OpenAIProviderAdapter**: traduce las operaciones de la interfaz `AIProvider` a las llamadas específicas de la API de OpenAI, gestionando el formato de mensajes, el streaming de eventos y la traducción de errores propios de OpenAI al formato interno.
- **AnthropicProviderAdapter**: traduce las operaciones de la interfaz `AIProvider` a las llamadas específicas de la API de Anthropic, gestionando el formato de mensajes, el streaming de eventos y la traducción de errores propios de Anthropic al formato interno.

Cada adaptador reside exclusivamente en la capa de adaptadores de la arquitectura y es la única parte del sistema que conoce los detalles del SDK o la API HTTP del proveedor correspondiente.

### 5.3 Fábrica de proveedores

Se define un componente de fábrica (`AIProviderFactory`) responsable de instanciar el adaptador correcto en tiempo de ejecución, en función del proveedor configurado para un widget determinado. Los casos de uso solicitan un `AIProvider` a la fábrica sin conocer qué implementación concreta reciben.

### 5.4 Extensibilidad

La incorporación de un proveedor adicional en el futuro (fuera del alcance de la primera versión) debe requerir únicamente: la creación de un nuevo adaptador que implemente `AIProvider`, su registro en la fábrica de proveedores, y la adición del identificador del proveedor en el catálogo de proveedores soportados. Ningún otro módulo del sistema (casos de uso, controladores, componentes de UI genéricos, base de datos) debe modificarse estructuralmente para soportar el nuevo proveedor, salvo la incorporación de sus campos de configuración específicos.

---

## 6. Módulo de Integración con n8n

### 6.1 Alcance

La plataforma soporta integraciones de automatización exclusivamente mediante n8n, a través de Webhooks. No se contempla ningún otro proveedor de automatización.

### 6.2 Entidad de integración n8n

Cada integración configurada debe permitir definir:

- URL del Webhook de destino.
- Método HTTP a utilizar (POST, GET, PUT, PATCH).
- Encabezados personalizados (clave-valor, con soporte para valores sensibles almacenados de forma cifrada).
- Mecanismo de autenticación del Webhook (sin autenticación, cabecera de autenticación estática, token en cabecera, autenticación básica).
- Variables dinámicas que se insertan en la URL, en los encabezados o en el cuerpo de la solicitud, resueltas en tiempo de ejecución a partir del contexto de la conversación.
- Tiempo máximo de espera de la respuesta (timeout).
- Política de reintentos (número máximo de intentos, estrategia de espera entre intentos).
- Política de manejo de errores (qué hacer si el Webhook falla o no responde dentro del tiempo esperado: continuar la conversación con un mensaje de error controlado, o interrumpir el flujo).
- Definición del formato de respuesta esperado del Webhook, incluyendo cómo se interpreta el campo o campos que contienen el contenido a mostrar al usuario final.

### 6.3 Asociación con widgets

Un widget puede tener asociadas cero, una o varias integraciones de n8n. La configuración de cada widget determina en qué punto del flujo conversacional se invoca cada integración (por ejemplo, antes de consultar al proveedor de IA, después de recibir la respuesta del proveedor, o como acción independiente disparada por una intención detectada).

### 6.4 Payload enviado al Webhook

Cada solicitud enviada a un Webhook de n8n debe incluir, como estructura de datos normalizada:

- Identificador del usuario final (si existe identificación disponible).
- Identificador de sesión.
- Identificador de conversación.
- Historial de la conversación relevante según la configuración.
- Mensaje actual del usuario.
- Variables personalizadas definidas en la configuración del widget o de la integración.
- Metadata adicional (información de contexto de la página, user agent, idioma detectado).
- Dominio desde el cual se originó la solicitud.
- Identificador del widget.
- Identificador de la organización propietaria del widget.
- Marca de fecha y hora de la solicitud, en formato estándar con zona horaria.

### 6.5 Procesamiento de la respuesta

El backend debe interpretar la respuesta del Webhook conforme a la configuración de formato esperado, extraer el contenido relevante, y decidir el siguiente paso del flujo conversacional: continuar hacia el proveedor de IA, devolver directamente el contenido al widget, o combinar el resultado del Webhook con el contexto enviado posteriormente al proveedor de IA. Cualquier error de comunicación, tiempo de espera agotado o respuesta mal formada debe manejarse conforme a la política de manejo de errores configurada, sin exponer nunca detalles internos del error al usuario final del widget.

### 6.6 Módulo técnico

Se define un módulo `N8nIntegrationService` en la capa de adaptadores, responsable de: construir la solicitud HTTP a partir de la configuración e interpolar las variables dinámicas, ejecutar la solicitud aplicando timeout y reintentos, registrar cada ejecución (éxito, fallo, tiempo de respuesta, código de estado) y normalizar la respuesta o el error hacia el caso de uso que orquesta la conversación.

---

## 7. Estructura Completa de Carpetas del Proyecto

```
/app
  /(dashboard)
    /inicio
    /widgets
      /[widgetId]
        /general
        /apariencia
        /proveedor
        /integraciones
        /dominios
        /avanzado
    /analiticas
    /proveedores-ia
    /integraciones-n8n
    /usuarios
    /equipos
    /configuracion
    /perfil
    /facturacion
    /logs
    /historial
  /(auth)
    /iniciar-sesion
    /registro
    /recuperar-password
  /api
    /v1
      /auth
      /widgets
      /providers
      /integrations
      /conversations
      /messages
      /sessions
      /analytics
      /snippet
      /webhook
      /organizations
      /teams
      /users
      /logs
  /widget-embed
    /loader
    /runtime
/components
  /ui
  /dashboard
  /widget-preview
  /forms
  /charts
  /shared
/hooks
/providers
  /ai
    /openai
    /anthropic
    /interfaces
    /factory
  /n8n
/services
  /widgets
  /organizations
  /analytics
  /conversations
  /sessions
  /snippets
  /webhooks
/domain
  /entities
  /use-cases
  /repositories-interfaces
  /errors
/infrastructure
  /supabase
    /client
    /repositories
    /migrations
    /policies
  /storage
/types
/lib
  /validation
  /encryption
  /rate-limiting
  /http
  /constants
/context
/middleware
/config
/assets
  /icons
  /fonts
/widget-client
  /core
  /ui
  /styles
  /snippet-loader
```

Cada carpeta de nivel superior corresponde a una responsabilidad arquitectónica clara: `domain` contiene las entidades y reglas de negocio puras; `services` contiene los casos de uso que orquestan repositorios y adaptadores; `providers` contiene los adaptadores de proveedores de IA y de n8n; `infrastructure` contiene las implementaciones concretas de acceso a Supabase; `widget-client` contiene el código fuente que se compila al script embebible público, completamente aislado del código del dashboard.

---

## 8. Componentes Reutilizables

Se define un catálogo de componentes base construidos sobre shadcn/ui y Tailwind CSS, ubicados en `/components/ui` y `/components/shared`, que deben implementarse antes de construir cualquier pantalla:

- **Button**: variantes primaria, secundaria, destructiva, fantasma y enlace; tamaños pequeño, mediano y grande; estados de carga y deshabilitado; soporte para icono a la izquierda o derecha.
- **Input**: campo de texto con soporte para etiqueta, texto de ayuda, mensaje de error, icono, y estado deshabilitado.
- **Textarea**: campo de texto multilínea con autoajuste de altura y contador de caracteres opcional.
- **Select**: selector desplegable con búsqueda opcional, soporte para agrupación de opciones y selección múltiple.
- **Modal**: ventana superpuesta centrada para confirmaciones y formularios cortos.
- **Drawer**: panel lateral deslizante para formularios extensos o configuración detallada.
- **Sheet**: variante de panel deslizante para vistas de detalle rápido.
- **Dialog**: componente base de confirmación con acciones primaria y secundaria.
- **Sidebar**: navegación lateral principal del dashboard, con soporte para colapsar, agrupación de secciones y resaltado de la ruta activa.
- **Navbar**: barra superior con selector de organización, accesos rápidos y menú de perfil.
- **Card**: contenedor de contenido con encabezado, cuerpo y pie opcional, usado para métricas, resúmenes y listados.
- **Avatar**: representación visual de usuario o widget, con soporte para imagen, iniciales y indicador de estado.
- **Badge**: etiqueta visual de estado (activo, inactivo, en pausa, error) con variantes de color semántico.
- **Tabs**: navegación por pestañas dentro de una misma pantalla (por ejemplo, las secciones de configuración de un widget).
- **Color Picker**: selector de color utilizado en la personalización visual del widget, con soporte para valores hexadecimales y paletas predefinidas.
- **Theme Editor**: panel compuesto que agrupa controles de tipografía, colores, espaciados, bordes y sombras para la personalización visual completa de un widget.
- **Provider Selector**: componente de selección del proveedor de inteligencia artificial y del modelo asociado, con validación de credenciales integrada.
- **Widget Preview**: componente de previsualización en vivo que renderiza el widget con la configuración actual sin necesidad de publicarlo.
- **Analytics Chart**: componente de visualización de métricas (series de tiempo, distribución, comparativas) reutilizado en todas las pantallas de analíticas.
- **Conversation Viewer**: componente de visualización de una conversación completa, con distinción visual entre mensajes del usuario, del asistente y eventos de integración con n8n.
- **Snippet Generator**: componente que presenta el fragmento de código generado para un widget, con función de copiado y validación de dominios configurados.

Todos los componentes deben ser agnósticos de datos (reciben props tipadas y no acceden directamente a servicios), promoviendo la reutilización tanto en el dashboard como en distintas pantallas de configuración.

---

## 9. Dashboard Principal

### 9.1 Inicio

**Objetivo**: ofrecer una vista general del estado de la cuenta y accesos rápidos a las acciones más frecuentes.

**Componentes**: tarjetas de resumen (widgets activos, conversaciones recientes, consumo de tokens del período), lista de actividad reciente, accesos directos a creación de widget y configuración de proveedor.

**Flujo**: al ingresar, el usuario visualiza el estado agregado de su organización; puede navegar directamente a cualquier módulo desde los accesos rápidos.

**Acciones disponibles**: crear nuevo widget, ver detalle de actividad, cambiar de organización si pertenece a varias.

**Estados**: carga inicial, sin datos (organización nueva sin widgets), con datos.

**Navegación**: punto de entrada tras iniciar sesión; accesible desde el ítem "Inicio" de la barra lateral.

### 9.2 Widgets

**Objetivo**: administrar el ciclo de vida completo de los widgets de la organización.

**Componentes**: listado de widgets en formato de tarjetas o tabla, con nombre, estado, proveedor asociado, dominios permitidos y fecha de última actualización; barra de búsqueda y filtros por estado y proveedor; botón de creación de nuevo widget.

**Flujo**: el usuario visualiza todos los widgets existentes, puede filtrarlos, acceder al detalle de configuración de cada uno, duplicar, archivar o eliminar un widget, y crear uno nuevo mediante un asistente de configuración por pasos.

**Acciones disponibles**: crear, editar, duplicar, archivar, eliminar, publicar, despublicar, generar snippet.

**Estados**: lista vacía, lista con resultados, lista filtrada sin resultados, carga.

**Navegación**: desde el listado se accede al detalle de cada widget, organizado en las subsecciones General, Apariencia, Proveedor, Integraciones, Dominios y Avanzado.

### 9.3 Analíticas

**Objetivo**: presentar métricas de uso y desempeño de los widgets.

**Componentes**: selector de widget y de rango de fechas, gráficos de series de tiempo (conversaciones, mensajes, errores), tarjetas de métricas agregadas (usuarios únicos, tiempo promedio de respuesta, tokens consumidos), tabla de calificaciones y retroalimentación.

**Flujo**: el usuario selecciona un widget y un período; el sistema recalcula y presenta las métricas correspondientes; puede exportar o profundizar en una métrica específica.

**Acciones disponibles**: cambiar widget, cambiar rango de fechas, exportar reporte, ver detalle de una conversación desde la analítica.

**Estados**: sin datos suficientes en el período, carga de datos, datos disponibles.

**Navegación**: accesible desde la barra lateral; enlaza al visor de conversaciones para profundizar en casos individuales.

### 9.4 Proveedores IA

**Objetivo**: configurar y administrar las credenciales y parámetros de los proveedores de inteligencia artificial disponibles para la organización.

**Componentes**: listado de proveedores soportados (OpenAI, Anthropic) con estado de conexión, formulario de configuración de credenciales, selector de modelos disponibles por proveedor, panel de parámetros por defecto, indicador de consumo asociado.

**Flujo**: el usuario selecciona un proveedor, ingresa las credenciales, el sistema las valida contra el proveedor correspondiente, y una vez validadas quedan disponibles para asociarse a cualquier widget de la organización.

**Acciones disponibles**: agregar credenciales, validar credenciales, editar parámetros por defecto, revocar o eliminar configuración, ver registro de consumo por proveedor.

**Estados**: proveedor no configurado, credenciales pendientes de validación, credenciales válidas, credenciales inválidas o expiradas.

**Navegación**: accesible desde la barra lateral; referenciado también desde la sección Proveedor de cada widget.

### 9.5 Integraciones n8n

**Objetivo**: administrar las integraciones de automatización disponibles para asociar a los widgets.

**Componentes**: listado de integraciones configuradas, formulario de configuración de Webhook (URL, método, encabezados, autenticación, variables, timeout, reintentos, manejo de errores, formato de respuesta esperado), panel de pruebas de conexión, registro de ejecuciones recientes.

**Flujo**: el usuario crea una integración especificando todos los parámetros del Webhook, prueba la conexión con una ejecución de verificación, y una vez validada la integración queda disponible para asociarse a uno o varios widgets.

**Acciones disponibles**: crear, editar, probar conexión, eliminar, ver historial de ejecuciones.

**Estados**: integración sin probar, prueba exitosa, prueba fallida, integración activa, integración deshabilitada.

**Navegación**: accesible desde la barra lateral; referenciada también desde la sección Integraciones de cada widget.

### 9.6 Usuarios

**Objetivo**: administrar los usuarios que tienen acceso a la organización.

**Componentes**: tabla de usuarios con nombre, correo, rol y estado; formulario de invitación; selector de rol.

**Flujo**: el usuario con permisos administrativos invita nuevos usuarios por correo, asigna un rol, y puede modificar o revocar el acceso de usuarios existentes.

**Acciones disponibles**: invitar, cambiar rol, revocar acceso, reenviar invitación.

**Estados**: invitación pendiente, usuario activo, usuario suspendido.

**Navegación**: accesible desde la barra lateral, restringida a roles con permisos administrativos.

### 9.7 Equipos

**Objetivo**: agrupar usuarios en equipos con permisos diferenciados sobre conjuntos de widgets.

**Componentes**: listado de equipos, formulario de creación de equipo, asignación de miembros, asignación de widgets visibles por equipo.

**Flujo**: el usuario administrador crea equipos, asigna miembros y define qué widgets puede administrar cada equipo.

**Acciones disponibles**: crear equipo, editar miembros, asignar widgets, eliminar equipo.

**Estados**: sin equipos creados, listado con equipos.

**Navegación**: accesible desde la barra lateral; relacionado con la sección Usuarios.

### 9.8 Configuración

**Objetivo**: administrar parámetros generales de la organización.

**Componentes**: formulario de datos de la organización, configuración de zona horaria e idioma por defecto, preferencias de notificaciones administrativas.

**Flujo**: el usuario administrador modifica los parámetros generales que aplican a toda la organización.

**Acciones disponibles**: editar datos generales, guardar cambios.

**Estados**: formulario limpio, formulario con cambios sin guardar, guardado exitoso.

**Navegación**: accesible desde la barra lateral.

### 9.9 Perfil

**Objetivo**: administrar la información personal y credenciales del usuario autenticado.

**Componentes**: formulario de datos personales, cambio de contraseña, preferencias de interfaz (tema).

**Flujo**: el usuario edita su información personal o sus credenciales de acceso.

**Acciones disponibles**: editar nombre, cambiar contraseña, cerrar sesión en todos los dispositivos.

**Estados**: formulario limpio, cambios guardados, error de validación.

**Navegación**: accesible desde el menú de usuario en la barra superior.

### 9.10 Facturación

**Objetivo**: presentar el estado de la suscripción y el historial de consumo asociado a la organización, exclusivamente desde una perspectiva de datos técnicos de uso, sin contenido comercial.

**Componentes**: resumen del plan activo, historial de períodos de facturación, detalle de consumo por widget y por proveedor.

**Flujo**: el usuario visualiza el consumo registrado por el sistema y el estado de su plan.

**Acciones disponibles**: ver detalle de consumo, descargar historial.

**Estados**: sin historial disponible, historial disponible.

**Navegación**: accesible desde la barra lateral.

### 9.11 Logs

**Objetivo**: presentar el registro técnico de eventos del sistema relevantes para la organización.

**Componentes**: tabla de eventos con marca de tiempo, tipo de evento, origen (widget, proveedor, integración n8n, sistema), severidad y detalle.

**Flujo**: el usuario filtra los eventos por tipo, severidad o widget, y accede al detalle de cada evento.

**Acciones disponibles**: filtrar, buscar, ver detalle de evento, exportar.

**Estados**: sin eventos en el rango seleccionado, listado con eventos.

**Navegación**: accesible desde la barra lateral.

### 9.12 Historial

**Objetivo**: presentar el historial completo de conversaciones registradas por todos los widgets de la organización, identificadas por el nombre del visitante cuando este haya sido capturado.

**Componentes**: tabla de conversaciones con widget asociado, nombre del visitante (o identificador técnico legible si el nombre no fue capturado), fecha, duración, número de mensajes, resultado (completada, abandonada, con error), acceso al visor de conversación.

**Flujo**: el usuario filtra el historial por widget, fecha, resultado o nombre del visitante, y accede al detalle completo de cualquier conversación mediante el componente Conversation Viewer, en el cual se visualiza el nombre del visitante en el encabezado del hilo cuando está disponible.

**Acciones disponibles**: filtrar, buscar por nombre del visitante, ver detalle, exportar, eliminar el nombre almacenado de una conversación sin eliminar sus mensajes.

**Estados**: sin conversaciones registradas, listado con resultados.

**Navegación**: accesible desde la barra lateral; enlazado también desde Analíticas.

---

## 10. Gestión de Widgets — Configuración Detallada

Cada widget debe permitir la configuración completa de los siguientes aspectos, organizados en las subsecciones definidas en la sección 9.2:

**Identificación y estado**: nombre, descripción, estado (borrador, publicado, pausado, archivado), logo, avatar del asistente.

**Apariencia**: tema base (claro, oscuro, automático según el sistema del visitante), paleta de colores (color primario, color de fondo, color de texto, color de burbujas de mensaje), tipografía (familia y escala tipográfica), configuración del encabezado (título visible, subtítulo, logo), configuración del pie del widget, mensaje inicial mostrado al abrir la conversación, lista de mensajes sugeridos que el usuario final puede seleccionar como punto de partida, posición del widget en la pantalla (inferior derecha, inferior izquierda, u otras posiciones predefinidas), tamaño de la ventana del widget (dimensiones de ancho y alto, o modo de pantalla completa en dispositivos móviles), radio de bordes, estilo y profundidad de sombras, espaciados internos entre elementos, animaciones de apertura, cierre y aparición de mensajes, configuración del botón flotante (icono, color, tamaño, animación de atención), texto de derechos de autor, indicador de "desarrollado por" (Powered By) con posibilidad de habilitar u ocultar según el plan, enlace inferior configurable (por ejemplo, hacia política de privacidad), idioma de la interfaz del widget.

**Restricciones de publicación**: lista de dominios permitidos para la carga del widget, con validación estricta en el backend; horarios de disponibilidad del widget (días y franjas horarias en las que el widget se muestra activo, con comportamiento configurable fuera de horario, como mostrar un mensaje de no disponibilidad o mantenerlo oculto).

**Configuración avanzada**: parámetros adicionales de comportamiento no cubiertos por las categorías anteriores, tales como persistencia de la conversación entre sesiones del mismo visitante, límite de mensajes por sesión, y comportamiento ante inactividad prolongada.

---

## 11. Proveedores de Inteligencia Artificial — Configuración Detallada

El módulo de proveedores, disponible únicamente para OpenAI y Anthropic, debe soportar por cada proveedor configurado:

- **Configuración independiente por organización**: cada organización mantiene su propio conjunto de credenciales por proveedor, aisladas de otras organizaciones.
- **Validación de credenciales**: verificación activa contra el proveedor al momento de guardar las credenciales, con resultado explícito de éxito o fallo.
- **Configuración del modelo**: selección del modelo específico soportado por el proveedor, disponible para asociarse a cada widget.
- **Parámetros del modelo**: temperatura, número máximo de tokens de salida, mensajes de sistema por defecto, y cualquier otro parámetro relevante soportado por el proveedor a través de la interfaz `AIProvider`.
- **Manejo de sesiones**: definición de cómo se construye el contexto de conversación enviado al proveedor (ventana de mensajes recientes, resumen de contexto extendido) por cada widget.
- **Manejo de errores**: clasificación y registro de los errores devueltos por el proveedor (autenticación, límite de uso alcanzado, contenido rechazado, error de servicio), con traducción a mensajes internos comprensibles y sin exposición de detalles sensibles al usuario final del widget.
- **Registro de consumo**: acumulación de tokens y solicitudes por widget, por proveedor y por organización, en períodos configurables.
- **Registro de tokens**: desagregación de tokens de entrada y de salida por cada solicitud realizada.
- **Registro de uso**: número de solicitudes, tasa de error y latencia promedio por proveedor.
- **Logs**: registro detallado de cada solicitud realizada al proveedor, incluyendo marca de tiempo, widget de origen, resultado y duración, sin almacenar las credenciales en texto plano en ningún registro.

---

## 12. Widget Embebible — Especificación Funcional

### 12.1 Composición del widget

El widget embebido está compuesto por los siguientes elementos funcionales:

- **Launcher**: botón flotante visible en la esquina configurada de la página anfitriona, responsable de abrir y cerrar la ventana de conversación.
- **Ventana**: contenedor principal de la interfaz conversacional, con encabezado, área de mensajes y área de entrada de texto.
- **Header**: sección superior de la ventana, que muestra el avatar, el nombre del asistente y el estado de conexión.
- **Avatar**: representación visual del asistente, configurable por widget.
- **Estado**: indicador visual del estado de la conversación (conectado, escribiendo, procesando integración externa, error).
- **Conversación**: listado de mensajes intercambiados entre el usuario final y el asistente, mostrados en orden cronológico.
- **Streaming**: renderizado progresivo del contenido de la respuesta del asistente a medida que se recibe desde el backend.
- **Markdown**: interpretación y renderizado de contenido con formato enriquecido (negritas, cursivas, encabezados, citas).
- **Código**: renderizado de bloques de código con resaltado de sintaxis.
- **Tablas**: renderizado de tablas incluidas en la respuesta del asistente.
- **Listas**: renderizado de listas ordenadas y no ordenadas.
- **Enlaces**: renderizado de enlaces con apertura segura en una nueva pestaña.
- **Scroll automático**: desplazamiento automático hacia el mensaje más reciente, con posibilidad de que el usuario final se desplace manualmente hacia mensajes anteriores sin interrupción.
- **Responsive**: adaptación completa de la interfaz a distintos tamaños de pantalla, incluyendo comportamiento de pantalla completa en dispositivos móviles.
- **Accesibilidad**: navegación mediante teclado, atributos de accesibilidad en todos los elementos interactivos, contraste de color conforme a criterios de legibilidad.
- **Modo oscuro**: soporte nativo de tema oscuro y claro, con selección automática según preferencia del sistema del visitante o configuración forzada del widget.
- **Tema personalizado**: aplicación en tiempo de renderizado de la configuración de apariencia definida en el dashboard para el widget correspondiente.

### 12.2 Flujo técnico completo del widget

1. El sitio anfitrión carga el snippet de JavaScript proporcionado por la plataforma, el cual referencia el script del cargador del widget (loader) alojado públicamente.
2. El navegador descarga el script del cargador de forma asíncrona, sin bloquear el renderizado de la página anfitriona.
3. El script del cargador lee el identificador único del widget embebido en el propio snippet.
4. El cargador realiza una solicitud a la API del backend para obtener la configuración pública del widget correspondiente a ese identificador.
5. El backend valida que el dominio desde el cual se origina la solicitud se encuentra dentro de la lista de dominios permitidos configurada para ese widget.
6. Si el dominio es válido y el widget se encuentra en estado publicado y dentro del horario permitido, el backend devuelve la configuración pública (apariencia, mensajes iniciales, mensajes sugeridos, idioma, restricciones de comportamiento), excluyendo cualquier credencial o dato sensible.
7. El cargador inyecta el contenedor del widget en el documento de la página anfitriona, aplicando el tema y la configuración visual recibida.
8. El cargador inicializa una sesión de conversación, generando o recuperando un identificador de sesión persistido en el navegador del visitante según la configuración de persistencia del widget.
9. El launcher se renderiza en la posición configurada; al ser activado por el visitante, se despliega la ventana de conversación mostrando el mensaje inicial y los mensajes sugeridos configurados.
10. Cuando el visitante envía un mensaje, el widget lo transmite a la API del backend junto con el identificador de sesión, el identificador de widget y el dominio de origen.
11. El backend valida la solicitud, registra el mensaje, y ejecuta el caso de uso de procesamiento conversacional correspondiente, que puede incluir la invocación de una o varias integraciones de n8n antes o después de consultar al proveedor de inteligencia artificial configurado.
12. El backend invoca al proveedor de inteligencia artificial a través de la interfaz `AIProvider`, empleando el adaptador correspondiente según la configuración del widget.
13. La respuesta del proveedor se transmite de vuelta al widget, en modo streaming cuando esté habilitado, a través de la conexión establecida entre el widget y la API del backend.
14. El widget renderiza progresivamente el contenido recibido, interpretando el formato enriquecido (Markdown, código, tablas, listas, enlaces) y desplazando automáticamente la vista hacia el nuevo contenido.
15. El backend persiste el mensaje de respuesta, actualiza los registros de analíticas correspondientes (mensajes, tokens, latencia) y registra cualquier evento relevante ocurrido durante el procesamiento.

### 12.3 Comunicación exclusiva con el backend

En ningún punto del flujo anterior el widget establece comunicación directa con OpenAI, Anthropic o cualquier endpoint de n8n. Toda comunicación externa al backend queda excluida del código del widget embebible.

### 12.4 Registro Persistente de Conversaciones por Widget

Toda conversación sostenida a través de cualquier widget debe quedar registrada de forma completa e íntegra, sin excepción, para permitir su consulta posterior desde el dashboard.

**Persistencia obligatoria de cada intercambio**: cada mensaje enviado por el visitante y cada mensaje generado por el asistente, incluyendo los eventos de invocación de integraciones de n8n cuando existan, deben persistirse de forma inmediata en las tablas `conversations` y `messages` en el momento en que ocurren, y no de forma diferida ni únicamente al finalizar la conversación. Esto garantiza que una conversación pueda consultarse desde el dashboard aunque el visitante aún no la haya cerrado, y que ninguna conversación se pierda ante un cierre abrupto del navegador del visitante.

**Recuperación de conversaciones**: el dashboard, a través de la pantalla Historial (sección 9.12) y del componente Conversation Viewer (sección 8), debe permitir localizar y reabrir en modo de solo lectura cualquier conversación registrada, independientemente de si el widget que la originó sigue activo, fue pausado o fue archivado posteriormente. La eliminación de un widget no debe eliminar en cascada su historial de conversaciones; dicho historial se conserva de forma independiente y queda accesible desde la organización propietaria, salvo que el usuario elimine explícitamente el historial.

**Cierre de sesión de conversación**: una conversación se marca con su desenlace (`outcome`: completada, abandonada o con error) cuando la sesión del visitante expira por inactividad, cuando el visitante cierra explícitamente la ventana del widget, o cuando ocurre un error no recuperable durante el procesamiento. En cualquiera de estos casos, todos los mensajes ya intercambiados permanecen persistidos.

### 12.5 Captura y Persistencia de la Identidad del Visitante

La plataforma debe ser capaz de asociar una conversación con el nombre del visitante que la sostuvo, cuando dicho nombre haya sido proporcionado en algún punto del intercambio, de manera que el historial de conversaciones sea identificable por nombre y no únicamente por identificadores técnicos.

**Origen del nombre del visitante**: el nombre puede obtenerse de dos formas, no excluyentes entre sí:

1. **Identificación explícita provista por el sitio anfitrión**: el snippet de inicialización del widget puede recibir, de forma opcional, datos de identificación del visitante ya conocidos por el sitio anfitrión (por ejemplo, un visitante que ya inició sesión en el sitio del cliente). Cuando estos datos están disponibles, el cargador los transmite en la inicialización de la sesión y el backend los persiste de inmediato, sin necesidad de inferencia adicional.
2. **Identificación inferida durante la conversación**: cuando el nombre del visitante no se conoce de antemano, el backend debe ser capaz de detectar, dentro del propio flujo conversacional, el momento en que el asistente solicita el nombre del visitante y el momento en que el visitante lo proporciona en su respuesta. Esta detección se resuelve como parte del caso de uso de procesamiento conversacional (sección 17), utilizando al mismo `AIProvider` configurado para el widget como mecanismo de extracción de la información de identidad contenida en el mensaje del visitante, sin necesidad de un servicio de reconocimiento de entidades independiente. El resultado de esta extracción es estrictamente el nombre identificado, o la ausencia de un nombre si no fue posible determinarlo con confianza suficiente; ningún otro dato personal se infiere ni se solicita como parte de este mecanismo salvo que el usuario lo proporcione voluntariamente.

**Persistencia del nombre**: en el momento en que el nombre del visitante queda determinado por cualquiera de los dos mecanismos anteriores, el backend debe actualizar el campo `visitor_name` tanto en el registro de `sessions` correspondiente como en el registro de `conversations` asociado, de forma que toda conversación futura dentro de la misma sesión y toda consulta posterior del historial reflejen el nombre identificado. Si una misma sesión sostiene varias conversaciones sucesivas, el nombre capturado en una conversación se propaga a las conversaciones posteriores de la misma sesión, salvo que el visitante proporcione un nombre distinto.

**Presentación en el dashboard**: la pantalla Historial (sección 9.12) y el componente Conversation Viewer deben mostrar el nombre del visitante como identificador principal de la conversación cuando esté disponible (por ejemplo, listando la conversación como "Conversación con [nombre]"), y recurrir a un identificador técnico legible (por ejemplo, un fragmento del identificador de sesión) únicamente cuando el nombre no haya sido determinado. El listado de Historial debe permitir buscar y filtrar conversaciones por nombre del visitante.

**Privacidad y control**: la captura del nombre del visitante es un dato personal y debe tratarse conforme a las mismas políticas RLS de aislamiento por organización aplicadas al resto de los datos de conversación. El usuario administrador de la organización debe poder eliminar el nombre almacenado de una sesión o conversación específica sin necesidad de eliminar el resto del historial de mensajes.

---

## 13. Generador de Snippet

### 13.1 Generación

Al publicar un widget, el sistema genera un fragmento de código JavaScript único asociado de forma inequívoca al identificador del widget. El fragmento no contiene configuración de apariencia ni lógica de negocio; únicamente referencia el identificador del widget y la ubicación del script del cargador público.

### 13.2 Identificación del widget

Cada widget se identifica mediante un identificador único generado por el sistema en el momento de su creación, utilizado tanto internamente en la base de datos como públicamente dentro del snippet, sin exponer información adicional de la organización.

### 13.3 Descarga de configuración

El script del cargador, al ejecutarse en el sitio anfitrión, realiza una solicitud a un endpoint público de configuración de la API, identificándose mediante el identificador del widget contenido en el snippet, y recibe como respuesta únicamente los datos de configuración pública descritos en la sección 12.2.

### 13.4 Validación de dominio

El backend contrasta el origen (dominio) de la solicitud recibida contra la lista de dominios permitidos configurada para el widget correspondiente. Si el dominio no está autorizado, el backend rechaza la solicitud de configuración y el widget no se renderiza en el sitio no autorizado.

### 13.5 Carga del widget

Una vez obtenida la configuración, el cargador construye dinámicamente los elementos visuales del widget dentro de un contenedor aislado del resto de estilos de la página anfitriona, evitando conflictos de estilos mediante encapsulamiento (uso de un árbol de sombra o un espacio de nombres de clases exclusivo).

### 13.6 Inicialización de sesión

El cargador establece o recupera un identificador de sesión de conversación, y notifica al backend la inicialización de dicha sesión para que quede registrada junto con el contexto del dominio, el widget y la marca de tiempo correspondiente.

### 13.7 Renderizado de la interfaz

Con la configuración y la sesión establecidas, el cargador monta el árbol de componentes visuales del widget (launcher, ventana, header, área de conversación) aplicando el tema y la configuración de apariencia obtenidos, quedando el widget listo para recibir interacción del visitante.

---

## 14. Analíticas — Métricas Registradas

Cada widget debe registrar de forma desagregada por período de tiempo:

- Usuarios únicos que han interactuado con el widget.
- Número total de conversaciones iniciadas.
- Número de mensajes enviados por los usuarios finales.
- Número de mensajes recibidos generados por el asistente.
- Tiempo promedio de respuesta del asistente.
- Número y tipo de errores ocurridos durante las conversaciones.
- Latencia de las solicitudes hacia el proveedor de inteligencia artificial y hacia las integraciones de n8n.
- Tokens consumidos, desagregados por tipo (entrada y salida).
- Consumo desagregado por proveedor de inteligencia artificial, en los casos en que la organización utiliza más de un proveedor entre distintos widgets.
- Retroalimentación explícita proporcionada por los usuarios finales sobre las respuestas recibidas.
- Calificaciones numéricas o categóricas asociadas a conversaciones o mensajes individuales, cuando el widget tiene habilitada esta funcionalidad.

Estas métricas alimentan tanto la pantalla de Analíticas del dashboard como los reportes agregados disponibles en la sección de Facturación.

---

## 15. Base de Datos — Especificación en Supabase PostgreSQL

A continuación se describen todas las tablas requeridas, con sus campos, tipos, relaciones, índices, restricciones y políticas de seguridad a nivel de fila (RLS). Todas las tablas incluyen, salvo indicación contraria, los campos de auditoría `created_at` (marca de tiempo, valor por defecto al momento actual) y `updated_at` (marca de tiempo, actualizada mediante disparador ante cualquier modificación).

### 15.1 `organizations`

- `id`: identificador único (UUID), clave primaria.
- `name`: texto, nombre de la organización, obligatorio.
- `slug`: texto, identificador legible único, restricción de unicidad.
- `owner_id`: UUID, referencia al usuario propietario en `users`.
- `timezone`: texto, zona horaria por defecto de la organización.
- `default_language`: texto, idioma por defecto aplicado a nuevos widgets.
- `status`: enumerado (activa, suspendida, eliminada).

Índices: índice único sobre `slug`. Índice sobre `owner_id`.

Políticas RLS: los usuarios solo pueden leer y modificar organizaciones a las que pertenecen mediante la tabla `organization_members`, verificado a través de una función de seguridad que consulta la pertenencia del usuario autenticado.

### 15.2 `users`

Tabla gestionada en conjunto con Supabase Auth; se extiende mediante una tabla de perfil:

- `id`: UUID, clave primaria, igual al identificador de Supabase Auth.
- `full_name`: texto.
- `email`: texto, único.
- `avatar_url`: texto, referencia a Supabase Storage.
- `locale`: texto, idioma preferido de la interfaz.
- `status`: enumerado (activo, suspendido).

Índices: índice único sobre `email`.

Políticas RLS: un usuario únicamente puede leer y actualizar su propio registro de perfil; la lectura de perfiles de otros usuarios de la misma organización se habilita mediante una vista restringida a los campos no sensibles.

### 15.3 `organization_members`

- `id`: UUID, clave primaria.
- `organization_id`: UUID, referencia a `organizations`, obligatorio.
- `user_id`: UUID, referencia a `users`, obligatorio.
- `role_id`: UUID, referencia a `roles`.
- `team_id`: UUID, referencia a `teams`, opcional.
- `invited_by`: UUID, referencia a `users`, opcional.
- `status`: enumerado (invitado, activo, suspendido).

Índices: índice compuesto único sobre (`organization_id`, `user_id`). Índice sobre `team_id`.

Restricciones: relación de clave foránea con eliminación en cascada al eliminar la organización.

Políticas RLS: lectura y escritura restringidas a miembros con rol administrativo dentro de la misma organización; cada usuario puede leer su propia membresía.

### 15.4 `roles`

- `id`: UUID, clave primaria.
- `organization_id`: UUID, referencia a `organizations`, nulo para roles del sistema predefinidos.
- `name`: texto, nombre del rol.
- `permissions`: estructura de datos JSON con la lista de permisos otorgados.
- `is_system_role`: booleano, indica si es un rol predefinido no editable.

Índices: índice sobre `organization_id`.

Políticas RLS: los roles del sistema son de solo lectura para todos los usuarios autenticados; los roles personalizados solo son administrables por miembros con permisos administrativos de la organización propietaria.

### 15.5 `teams`

- `id`: UUID, clave primaria.
- `organization_id`: UUID, referencia a `organizations`, obligatorio.
- `name`: texto, nombre del equipo.
- `description`: texto, opcional.

Índices: índice sobre `organization_id`.

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria, con administración limitada a roles administrativos.

### 15.6 `team_widgets`

- `id`: UUID, clave primaria.
- `team_id`: UUID, referencia a `teams`, obligatorio.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.

Índices: índice compuesto único sobre (`team_id`, `widget_id`).

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria del equipo.

### 15.7 `widgets`

- `id`: UUID, clave primaria.
- `organization_id`: UUID, referencia a `organizations`, obligatorio.
- `name`: texto, obligatorio.
- `description`: texto, opcional.
- `status`: enumerado (borrador, publicado, pausado, archivado).
- `provider_config_id`: UUID, referencia a `provider_configs`, obligatorio para publicación.
- `logo_url`: texto, referencia a Supabase Storage, opcional.
- `avatar_url`: texto, referencia a Supabase Storage, opcional.
- `language`: texto, idioma de la interfaz del widget.
- `created_by`: UUID, referencia a `users`.

Índices: índice sobre `organization_id`. Índice sobre `status`.

Restricciones: eliminación en cascada de configuraciones dependientes (apariencia, dominios, horarios, integraciones asociadas) al eliminar el widget.

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria; lectura pública restringida exclusivamente a un endpoint específico de configuración pública que expone únicamente los campos no sensibles, validado por dominio.

### 15.8 `widget_appearance`

- `id`: UUID, clave primaria.
- `widget_id`: UUID, referencia a `widgets`, único, obligatorio.
- `theme_mode`: enumerado (claro, oscuro, automático).
- `primary_color`: texto (valor hexadecimal).
- `background_color`: texto (valor hexadecimal).
- `text_color`: texto (valor hexadecimal).
- `font_family`: texto.
- `header_title`: texto.
- `header_subtitle`: texto, opcional.
- `footer_text`: texto, opcional.
- `initial_message`: texto.
- `suggested_messages`: estructura de datos JSON, lista de textos sugeridos.
- `position`: enumerado (inferior derecha, inferior izquierda, y demás posiciones soportadas).
- `window_width`: número entero.
- `window_height`: número entero.
- `border_radius`: número entero.
- `shadow_style`: texto o enumerado predefinido.
- `spacing_scale`: texto o enumerado predefinido.
- `animations_enabled`: booleano.
- `launcher_icon`: texto, referencia a icono predefinido o Storage.
- `launcher_color`: texto (valor hexadecimal).
- `copyright_text`: texto, opcional.
- `powered_by_enabled`: booleano.
- `footer_link_url`: texto, opcional.
- `footer_link_label`: texto, opcional.

Índices: índice único sobre `widget_id`.

Políticas RLS: idénticas a las de `widgets`, mediante verificación de pertenencia a la organización propietaria a través de una función de seguridad.

### 15.9 `widget_domains`

- `id`: UUID, clave primaria.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.
- `domain`: texto, obligatorio.
- `is_wildcard`: booleano, indica si permite subdominios.

Índices: índice compuesto único sobre (`widget_id`, `domain`).

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria del widget.

### 15.10 `widget_schedules`

- `id`: UUID, clave primaria.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.
- `day_of_week`: número entero (0 a 6).
- `start_time`: hora.
- `end_time`: hora.
- `timezone`: texto.
- `out_of_schedule_behavior`: enumerado (ocultar widget, mostrar mensaje de no disponibilidad).

Índices: índice sobre `widget_id`.

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria del widget.

### 15.11 `provider_configs`

- `id`: UUID, clave primaria.
- `organization_id`: UUID, referencia a `organizations`, obligatorio.
- `provider`: enumerado (openai, anthropic).
- `credentials_encrypted`: texto, valor cifrado, nunca expuesto en texto plano.
- `model`: texto, identificador del modelo seleccionado.
- `default_temperature`: número decimal.
- `default_max_tokens`: número entero.
- `default_system_prompt`: texto, opcional.
- `validation_status`: enumerado (pendiente, válida, inválida).
- `last_validated_at`: marca de tiempo, opcional.

Índices: índice sobre `organization_id`. Índice sobre `provider`.

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria; el campo `credentials_encrypted` nunca se expone a través de vistas de lectura general, únicamente accesible por funciones de servidor con privilegios elevados durante la ejecución de solicitudes a los proveedores.

### 15.12 `provider_usage_logs`

- `id`: UUID, clave primaria.
- `provider_config_id`: UUID, referencia a `provider_configs`, obligatorio.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.
- `conversation_id`: UUID, referencia a `conversations`, opcional.
- `input_tokens`: número entero.
- `output_tokens`: número entero.
- `latency_ms`: número entero.
- `status`: enumerado (éxito, error).
- `error_type`: enumerado (autenticación, límite de uso, contenido, disponibilidad, desconocido), opcional.

Índices: índice sobre `provider_config_id`. Índice sobre `widget_id`. Índice sobre `created_at`.

Políticas RLS: lectura restringida a miembros de la organización propietaria del widget asociado; escritura exclusiva mediante funciones de servidor.

### 15.13 `n8n_integrations`

- `id`: UUID, clave primaria.
- `organization_id`: UUID, referencia a `organizations`, obligatorio.
- `name`: texto, obligatorio.
- `webhook_url`: texto, obligatorio.
- `http_method`: enumerado (POST, GET, PUT, PATCH).
- `headers`: estructura de datos JSON, clave-valor.
- `auth_type`: enumerado (ninguna, cabecera estática, token, básica).
- `auth_credentials_encrypted`: texto, valor cifrado, opcional.
- `dynamic_variables`: estructura de datos JSON.
- `timeout_ms`: número entero.
- `retry_count`: número entero.
- `retry_backoff_ms`: número entero.
- `error_handling_strategy`: enumerado (continuar con mensaje controlado, interrumpir flujo).
- `expected_response_format`: estructura de datos JSON, definición del mapeo de campos esperados.
- `status`: enumerado (activa, deshabilitada).

Índices: índice sobre `organization_id`.

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria; los campos cifrados nunca se exponen en vistas de lectura general.

### 15.14 `widget_integrations`

- `id`: UUID, clave primaria.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.
- `integration_id`: UUID, referencia a `n8n_integrations`, obligatorio.
- `trigger_point`: enumerado (antes del proveedor de IA, después del proveedor de IA, acción independiente).
- `execution_order`: número entero.

Índices: índice compuesto sobre (`widget_id`, `execution_order`).

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria del widget.

### 15.15 `integration_execution_logs`

- `id`: UUID, clave primaria.
- `integration_id`: UUID, referencia a `n8n_integrations`, obligatorio.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.
- `conversation_id`: UUID, referencia a `conversations`, opcional.
- `request_payload`: estructura de datos JSON.
- `response_payload`: estructura de datos JSON, opcional.
- `status_code`: número entero, opcional.
- `duration_ms`: número entero.
- `attempt_number`: número entero.
- `result`: enumerado (éxito, error, tiempo agotado).

Índices: índice sobre `integration_id`. Índice sobre `widget_id`. Índice sobre `created_at`.

Políticas RLS: lectura restringida a miembros de la organización propietaria; escritura exclusiva mediante funciones de servidor.

### 15.16 `sessions`

- `id`: UUID, clave primaria.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.
- `visitor_identifier`: texto, identificador anónimo o proporcionado del visitante.
- `visitor_name`: texto, opcional, nombre del visitante identificado de forma explícita al inicializar el widget o inferido durante la conversación conforme a la sección 12.5.
- `domain`: texto, dominio de origen registrado.
- `user_agent`: texto, opcional.
- `started_at`: marca de tiempo.
- `last_activity_at`: marca de tiempo.
- `status`: enumerado (activa, expirada, cerrada).

Índices: índice sobre `widget_id`. Índice sobre `visitor_identifier`. Índice sobre `visitor_name` para soportar búsqueda en el Historial.

Políticas RLS: lectura restringida a miembros de la organización propietaria del widget; creación y actualización permitidas exclusivamente mediante funciones de servidor invocadas desde la API pública del widget.

### 15.17 `conversations`

- `id`: UUID, clave primaria.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.
- `session_id`: UUID, referencia a `sessions`, obligatorio.
- `visitor_name`: texto, opcional, valor denormalizado desde `sessions.visitor_name` en el momento en que se determina, para permitir listado y búsqueda directa del Historial sin necesidad de unir tablas.
- `started_at`: marca de tiempo.
- `ended_at`: marca de tiempo, opcional.
- `outcome`: enumerado (completada, abandonada, con error).
- `rating`: número entero, opcional.
- `feedback_text`: texto, opcional.

Índices: índice sobre `widget_id`. Índice sobre `session_id`. Índice sobre `started_at`. Índice sobre `visitor_name`.

Políticas RLS: lectura restringida a miembros de la organización propietaria del widget; escritura mediante funciones de servidor.

### 15.18 `messages`

- `id`: UUID, clave primaria.
- `conversation_id`: UUID, referencia a `conversations`, obligatorio.
- `role`: enumerado (usuario, asistente, sistema, integración).
- `content`: texto.
- `content_format`: enumerado (texto simple, markdown).
- `tokens_input`: número entero, opcional.
- `tokens_output`: número entero, opcional.
- `latency_ms`: número entero, opcional.
- `sequence_number`: número entero, orden dentro de la conversación.

Índices: índice sobre `conversation_id`. Índice compuesto sobre (`conversation_id`, `sequence_number`).

Políticas RLS: lectura restringida a miembros de la organización propietaria del widget asociado a la conversación; escritura mediante funciones de servidor.

### 15.19 `analytics_daily`

Tabla de agregación diaria precalculada para consultas eficientes en la pantalla de Analíticas.

- `id`: UUID, clave primaria.
- `widget_id`: UUID, referencia a `widgets`, obligatorio.
- `date`: fecha.
- `unique_users`: número entero.
- `conversations_count`: número entero.
- `messages_sent`: número entero.
- `messages_received`: número entero.
- `avg_response_time_ms`: número entero.
- `errors_count`: número entero.
- `tokens_input_total`: número entero.
- `tokens_output_total`: número entero.

Índices: índice compuesto único sobre (`widget_id`, `date`).

Políticas RLS: lectura restringida a miembros de la organización propietaria; escritura mediante funciones de servidor o procesos programados de agregación.

### 15.20 `events`

Tabla de registro general de eventos del sistema, utilizada por la pantalla de Logs.

- `id`: UUID, clave primaria.
- `organization_id`: UUID, referencia a `organizations`, obligatorio.
- `widget_id`: UUID, referencia a `widgets`, opcional.
- `event_type`: texto (por ejemplo, publicación de widget, fallo de integración, error de proveedor).
- `severity`: enumerado (información, advertencia, error, crítico).
- `source`: enumerado (widget, proveedor, integración n8n, sistema).
- `details`: estructura de datos JSON.

Índices: índice sobre `organization_id`. Índice sobre `severity`. Índice sobre `created_at`.

Políticas RLS: lectura restringida a miembros de la organización propietaria; escritura mediante funciones de servidor.

### 15.21 `snippets`

- `id`: UUID, clave primaria.
- `widget_id`: UUID, referencia a `widgets`, único, obligatorio.
- `public_key`: texto, identificador público único referenciado por el snippet.
- `generated_at`: marca de tiempo.
- `revoked`: booleano.

Índices: índice único sobre `widget_id`. Índice único sobre `public_key`.

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria del widget; el endpoint público de configuración únicamente consulta esta tabla para validar la vigencia del identificador, sin exponer su contenido íntegro.

### 15.22 `storage_assets`

Tabla de referencia complementaria a Supabase Storage para trazabilidad de archivos subidos (logos, avatares).

- `id`: UUID, clave primaria.
- `organization_id`: UUID, referencia a `organizations`, obligatorio.
- `widget_id`: UUID, referencia a `widgets`, opcional.
- `bucket`: texto.
- `path`: texto.
- `file_type`: texto.
- `uploaded_by`: UUID, referencia a `users`.

Índices: índice sobre `organization_id`. Índice sobre `widget_id`.

Políticas RLS: lectura y escritura restringidas a miembros de la organización propietaria.

### 15.23 Consideraciones generales de RLS

Todas las tablas tienen habilitada la seguridad a nivel de fila. Ninguna tabla permite acceso anónimo directo salvo a través de funciones de servidor específicas invocadas por los endpoints públicos del widget, las cuales operan con un rol de servicio controlado y validan explícitamente el dominio, el estado de publicación y la vigencia del widget antes de devolver cualquier dato. La pertenencia de un usuario a una organización se centraliza en una función de seguridad reutilizada por todas las políticas, evitando duplicación de lógica de autorización entre tablas.

---

## 16. Especificación de la API

### 16.1 Principios generales

La API se organiza bajo un prefijo de versionado (`/api/v1`) para permitir evoluciones futuras sin romper integraciones existentes. Se distinguen dos grupos de endpoints: los endpoints administrativos, que requieren sesión autenticada mediante Supabase Auth y pertenencia a una organización, y los endpoints públicos del widget, que no requieren sesión de usuario pero exigen validación de dominio y de identificador de widget.

### 16.2 Autenticación

Los endpoints administrativos validan la sesión del usuario mediante el token emitido por Supabase Auth, adjunto en cada solicitud. Un middleware de autenticación intercepta las solicitudes hacia las rutas administrativas, resuelve el usuario autenticado y su organización activa, y rechaza cualquier solicitud sin sesión válida o sin pertenencia a la organización referenciada en la ruta o en el cuerpo de la solicitud.

Los endpoints públicos del widget no emplean autenticación de usuario; en su lugar, aplican un middleware de validación de origen que verifica el dominio de la solicitud contra la configuración de dominios permitidos del widget referenciado por su identificador público.

### 16.3 Middleware

- **Middleware de autenticación**: resuelve la sesión y la organización activa para rutas administrativas.
- **Middleware de autorización por rol**: verifica que el usuario autenticado posea el permiso requerido para la operación solicitada (por ejemplo, solo roles administrativos pueden gestionar usuarios o eliminar widgets).
- **Middleware de validación de dominio**: aplicado exclusivamente a los endpoints públicos del widget, verifica el origen de la solicitud contra los dominios permitidos configurados.
- **Middleware de límite de solicitudes**: aplica límites de frecuencia de solicitudes tanto a endpoints administrativos como públicos, con umbrales diferenciados, para mitigar abuso.
- **Middleware de validación de esquema**: valida el cuerpo de cada solicitud contra un esquema de tipos estrictos antes de que la solicitud llegue al controlador correspondiente.

### 16.4 Grupos de endpoints

**Autenticación** (`/api/v1/auth`): registro de usuario, inicio de sesión, recuperación de contraseña, cierre de sesión. Métodos POST para todas las operaciones de escritura de credenciales.

**Organizaciones** (`/api/v1/organizations`): creación de organización, lectura de organización activa, actualización de configuración general, listado de miembros. Métodos GET, POST, PATCH según la operación.

**Usuarios** (`/api/v1/users`): invitación de usuario, listado de usuarios de la organización, actualización de rol, revocación de acceso. Métodos GET, POST, PATCH, DELETE.

**Equipos** (`/api/v1/teams`): creación, listado, actualización de miembros, asignación de widgets, eliminación. Métodos GET, POST, PATCH, DELETE.

**Widgets** (`/api/v1/widgets`): creación, listado, obtención de detalle, actualización de configuración general y de apariencia, cambio de estado (publicar, pausar, archivar), eliminación, duplicación. Métodos GET, POST, PATCH, DELETE.

**Proveedores** (`/api/v1/providers`): creación y actualización de configuración de proveedor, validación de credenciales, listado de modelos disponibles por proveedor, consulta de consumo. Métodos GET, POST, PATCH, DELETE.

**Integraciones n8n** (`/api/v1/integrations`): creación, listado, actualización, prueba de conexión, eliminación, asociación y desasociación con widgets. Métodos GET, POST, PATCH, DELETE.

**Conversaciones** (`/api/v1/conversations`): listado con filtros, obtención de detalle completo con sus mensajes. Métodos GET.

**Mensajes** (`/api/v1/messages`): endpoint público invocado por el widget embebido para enviar un mensaje del visitante y recibir la respuesta procesada, con soporte de conexión en modo streaming. Método POST.

**Sesiones** (`/api/v1/sessions`): endpoint público para inicialización y renovación de sesión de conversación desde el widget embebido. Métodos POST, GET.

**Analíticas** (`/api/v1/analytics`): consulta de métricas agregadas por widget y por rango de fechas. Método GET.

**Snippet** (`/api/v1/snippet`): generación y regeneración del identificador público de snippet para un widget, y endpoint público de obtención de configuración pública del widget consumido por el cargador embebido. Métodos GET, POST.

**Webhook** (`/api/v1/webhook`): endpoint interno de disparo de pruebas de conexión hacia integraciones de n8n desde el dashboard. Método POST.

**Logs** (`/api/v1/logs`): consulta de eventos del sistema con filtros de severidad, tipo y widget. Método GET.

### 16.5 Flujo de errores

Toda respuesta de error de la API sigue una estructura uniforme que incluye un código de error interno, un mensaje descriptivo apto para presentación y, cuando corresponda, detalles adicionales no sensibles. Los errores se clasifican en categorías: error de validación de entrada, error de autenticación, error de autorización, error de recurso no encontrado, error de límite de solicitudes excedido, error de dependencia externa (proveedor de IA o integración n8n), y error interno no controlado. Los errores originados en proveedores de IA o integraciones externas nunca exponen detalles internos de dichos servicios al llamante; se traducen siempre a la clasificación interna de errores de la plataforma.

### 16.6 Versionado

El versionado de la API se gestiona mediante el prefijo de ruta (`/api/v1`, y en el futuro `/api/v2` si fuese necesario), permitiendo la coexistencia temporal de versiones durante procesos de migración de integraciones existentes, en particular del script del widget embebido que pudiera estar desplegado en sitios de terceros con una versión de snippet anterior.

---

## 17. Flujo Técnico Integral de la Plataforma

1. El usuario inicia sesión en el dashboard mediante Supabase Auth, quedando resuelta su organización activa.
2. El usuario crea un nuevo widget desde la sección Widgets, completando el asistente de configuración inicial.
3. El usuario selecciona el proveedor de inteligencia artificial (OpenAI o Anthropic) que utilizará el widget, desde la sección Proveedor del widget o reutilizando una configuración existente de la sección Proveedores IA.
4. El usuario configura o reutiliza las credenciales y parámetros del modelo para dicho proveedor; el sistema valida las credenciales contra el proveedor correspondiente.
5. El usuario personaliza completamente la apariencia y el comportamiento del widget conforme a lo especificado en la sección 10, verificando el resultado mediante el componente de previsualización en vivo.
6. De forma opcional, el usuario asocia una o varias integraciones de n8n al widget, definiendo el punto de disparo de cada una dentro del flujo conversacional.
7. El usuario guarda la configuración completa del widget, quedando persistida en las tablas correspondientes de la base de datos.
8. El usuario publica el widget, cambiando su estado a publicado, lo cual habilita su disponibilidad para ser cargado desde dominios autorizados.
9. El sistema genera el snippet asociado al widget, identificado de forma única.
10. El usuario inserta el snippet generado en el código fuente de su sitio web.
11. Un visitante accede al sitio web; el navegador descarga el script del cargador del widget referenciado en el snippet.
12. El cargador obtiene la configuración pública del widget desde la API del backend, tras la validación del dominio de origen.
13. Se inicializa una sesión de conversación para el visitante.
14. El visitante interactúa con el widget y envía mensajes, los cuales se transmiten a la API del backend junto con el contexto de sesión.
15. El backend, dentro del caso de uso de procesamiento conversacional, consulta al proveedor de inteligencia artificial configurado a través del adaptador correspondiente de la interfaz `AIProvider`.
16. Si el widget tiene integraciones de n8n asociadas, el backend ejecuta el flujo correspondiente en el punto de disparo configurado (antes o después de la consulta al proveedor de IA), enviando el payload normalizado descrito en la sección 6.4.
17. El backend recibe la respuesta del proveedor de inteligencia artificial y, cuando corresponda, la respuesta procesada de la integración de n8n.
18. El backend normaliza y combina las respuestas según la configuración del flujo del widget, y transmite el resultado final hacia el widget embebido.
19. El widget renderiza el contenido recibido, aplicando la interpretación de formato enriquecido y el desplazamiento automático de la vista.
20. El backend persiste de forma inmediata la conversación y los mensajes intercambiados en ese intercambio, sin esperar al cierre de la conversación, y actualiza los registros de analíticas (usuarios únicos, conteo de mensajes, tokens consumidos, latencia, errores) correspondientes al widget.
21. Como parte del mismo caso de uso de procesamiento conversacional, el backend evalúa si el intercambio recién persistido contiene información de identidad del visitante (el asistente solicitó el nombre y el visitante lo proporcionó en su respuesta), conforme al mecanismo descrito en la sección 12.5. De ser así, actualiza el campo `visitor_name` en `sessions` y en `conversations`, quedando la conversación identificable por nombre en el Historial desde ese momento en adelante.

---

## 18. Fases de Implementación

### Fase 1 — Fundaciones de arquitectura y base de datos

**Objetivo**: establecer la estructura base del proyecto, la configuración de Supabase y las capas de dominio sin funcionalidad de negocio visible.

**Módulos involucrados**: estructura de carpetas, configuración de TypeScript estricto, configuración de Supabase (proyecto, autenticación, políticas base), definición de entidades de dominio.

**Dependencias**: ninguna, es la fase inicial.

**Componentes**: ninguno visible aún; se establece el sistema de diseño base (tokens de Tailwind, configuración de shadcn/ui, configuración de tema oscuro por defecto).

**Hooks**: ninguno funcional aún; se define la convención de organización de hooks.

**Servicios**: se definen las interfaces de repositorios de dominio (sin implementación concreta todavía).

**Endpoints**: ninguno funcional aún.

**Tablas**: `organizations`, `users`, `organization_members`, `roles`, `teams`, `team_widgets`.

**Resultado esperado**: proyecto Next.js inicializado con arquitectura de carpetas completa, base de datos con las tablas fundacionales de identidad y organización, políticas RLS base aplicadas, autenticación funcional mediante Supabase Auth.

### Fase 2 — Autenticación, organizaciones y gestión de usuarios y equipos

**Objetivo**: habilitar el flujo completo de registro, inicio de sesión, gestión de organización, usuarios, roles y equipos dentro del dashboard.

**Módulos involucrados**: pantallas de autenticación, pantalla de Usuarios, pantalla de Equipos, pantalla de Configuración de organización, pantalla de Perfil.

**Dependencias**: Fase 1 completa.

**Componentes**: Sidebar, Navbar, Card, Avatar, Badge, Tabs, formularios base (Input, Select, Button, Modal, Drawer).

**Hooks**: hook de sesión autenticada, hook de organización activa, hook de permisos por rol.

**Servicios**: servicio de gestión de usuarios, servicio de gestión de equipos, servicio de gestión de organización.

**Endpoints**: `/api/v1/auth`, `/api/v1/organizations`, `/api/v1/users`, `/api/v1/teams`.

**Tablas**: reutiliza las de la Fase 1; no introduce tablas nuevas.

**Resultado esperado**: dashboard navegable con autenticación funcional, gestión completa de usuarios, roles, equipos y configuración general de la organización, con políticas de autorización aplicadas en todos los endpoints correspondientes.

### Fase 3 — Módulo de proveedores de inteligencia artificial

**Objetivo**: implementar la interfaz `AIProvider`, sus adaptadores concretos, y la pantalla de gestión de proveedores.

**Módulos involucrados**: capa de adaptadores de IA, pantalla Proveedores IA, servicio de validación y registro de consumo.

**Dependencias**: Fase 1 y Fase 2 completas.

**Componentes**: Provider Selector, formularios de configuración de credenciales, indicadores de estado de validación.

**Hooks**: hook de configuración de proveedor activo por organización.

**Servicios**: `AIProviderFactory`, `OpenAIProviderAdapter`, `AnthropicProviderAdapter`, servicio de registro de consumo y tokens.

**Endpoints**: `/api/v1/providers`.

**Tablas**: `provider_configs`, `provider_usage_logs`.

**Resultado esperado**: organización capaz de configurar y validar credenciales de OpenAI y Anthropic de forma completamente intercambiable a través de la interfaz `AIProvider`, con registro de consumo funcional.

### Fase 4 — Gestión completa de widgets y personalización visual

**Objetivo**: implementar la creación, configuración general, apariencia, dominios y horarios de los widgets, junto con la previsualización en vivo.

**Módulos involucrados**: pantalla Widgets y todas sus subsecciones, motor de previsualización.

**Dependencias**: Fase 1, Fase 2 y Fase 3 completas (un widget requiere un proveedor configurado para su publicación).

**Componentes**: Widget Preview, Theme Editor, Color Picker, formularios de configuración por subsección.

**Hooks**: hook de estado de configuración de widget en edición, hook de previsualización sincronizada.

**Servicios**: servicio de gestión de widgets, servicio de gestión de apariencia, servicio de gestión de dominios y horarios.

**Endpoints**: `/api/v1/widgets` (incluyendo subrutas de apariencia, dominios y horarios).

**Tablas**: `widgets`, `widget_appearance`, `widget_domains`, `widget_schedules`.

**Resultado esperado**: creación y personalización completa de widgets desde el dashboard, con previsualización en vivo funcional y persistencia completa de toda la configuración descrita en la sección 10.

### Fase 5 — Módulo de integraciones n8n

**Objetivo**: implementar la configuración de integraciones de n8n y su asociación con widgets.

**Módulos involucrados**: pantalla Integraciones n8n, sección Integraciones del widget, servicio de ejecución de Webhooks.

**Dependencias**: Fase 1, Fase 2 y Fase 4 completas.

**Componentes**: formulario de configuración de Webhook, panel de pruebas de conexión, listado de ejecuciones.

**Hooks**: hook de estado de prueba de integración.

**Servicios**: `N8nIntegrationService`, servicio de asociación de integraciones a widgets.

**Endpoints**: `/api/v1/integrations`, `/api/v1/webhook`.

**Tablas**: `n8n_integrations`, `widget_integrations`, `integration_execution_logs`.

**Resultado esperado**: integraciones de n8n configurables, probables y asociables a widgets, con ejecución controlada por timeout, reintentos y manejo de errores conforme a la especificación de la sección 6.

### Fase 6 — Snippet, widget embebible y flujo conversacional

**Objetivo**: implementar el generador de snippet, el script del cargador, el runtime del widget embebible y el flujo conversacional completo, incluyendo la orquestación entre proveedor de IA e integraciones de n8n.

**Módulos involucrados**: `widget-client`, endpoints públicos de configuración, sesión y mensajes, caso de uso de procesamiento conversacional.

**Dependencias**: Fase 3, Fase 4 y Fase 5 completas.

**Componentes**: Launcher, Ventana, Header, área de conversación, renderizado de Markdown, código, tablas, listas y enlaces, Snippet Generator.

**Hooks**: hook de sesión de widget embebido, hook de streaming de mensajes.

**Servicios**: servicio de generación de snippet, servicio de configuración pública del widget, caso de uso de procesamiento conversacional que orquesta `AIProvider` y `N8nIntegrationService`.

**Endpoints**: `/api/v1/snippet`, `/api/v1/sessions`, `/api/v1/messages`.

**Tablas**: `snippets`, `sessions`, `conversations`, `messages`.

**Resultado esperado**: widget completamente funcional, embebible mediante snippet en un sitio externo, con flujo conversacional completo end-to-end, incluyendo streaming de respuestas y ejecución de integraciones de n8n cuando corresponda.

### Fase 7 — Analíticas, logs e historial

**Objetivo**: implementar el registro y presentación de métricas de uso, eventos del sistema e historial de conversaciones.

**Módulos involucrados**: pantalla Analíticas, pantalla Logs, pantalla Historial.

**Dependencias**: Fase 6 completa (requiere datos de conversaciones y mensajes generados).

**Componentes**: Analytics Chart, Conversation Viewer, tablas de eventos e historial con filtros.

**Hooks**: hook de rango de fechas seleccionado, hook de filtros de historial y logs.

**Servicios**: servicio de agregación de analíticas, servicio de registro de eventos.

**Endpoints**: `/api/v1/analytics`, `/api/v1/logs`, `/api/v1/conversations`.

**Tablas**: `analytics_daily`, `events`.

**Resultado esperado**: visibilidad completa del desempeño de cada widget, de los eventos técnicos del sistema y del historial detallado de conversaciones, con capacidad de profundizar desde las métricas agregadas hasta el detalle individual de cada conversación.

### Fase 8 — Facturación y almacenamiento

**Objetivo**: completar la pantalla de Facturación desde la perspectiva de consumo técnico registrado, y formalizar la gestión de archivos mediante Supabase Storage.

**Módulos involucrados**: pantalla Facturación, gestión de assets de Storage (logos, avatares).

**Dependencias**: Fase 3 y Fase 4 completas (requiere registros de consumo y configuración de widgets).

**Componentes**: resumen de consumo, tablas de historial de períodos.

**Hooks**: hook de consumo agregado por período.

**Servicios**: servicio de agregación de consumo para facturación, servicio de gestión de assets.

**Endpoints**: reutiliza `/api/v1/providers` y `/api/v1/analytics` para consumo; se define gestión de archivos dentro de `/api/v1/widgets` para logos y avatares.

**Tablas**: `storage_assets`.

**Resultado esperado**: visibilidad completa del consumo técnico por organización, widget y proveedor, y gestión centralizada y trazable de todos los archivos subidos a la plataforma.

### Fase 9 — Consolidación, seguridad y extensibilidad

**Objetivo**: verificar el cumplimiento estricto de la arquitectura de adaptadores, las políticas de seguridad a nivel de fila, y preparar el sistema para la incorporación futura de nuevos proveedores de inteligencia artificial sin modificar el núcleo de la plataforma.

**Módulos involucrados**: revisión transversal de todas las capas de dominio, adaptadores, y políticas RLS.

**Dependencias**: todas las fases anteriores completas.

**Componentes**: no introduce componentes nuevos; verifica la consistencia de los existentes.

**Hooks**: no introduce hooks nuevos.

**Servicios**: revisión de la fábrica de proveedores y de los contratos de las interfaces de dominio para confirmar su extensibilidad.

**Endpoints**: revisión de versionado y consistencia de manejo de errores en todos los grupos de endpoints.

**Tablas**: revisión de índices, restricciones y políticas RLS de todas las tablas definidas en la sección 15.

**Resultado esperado**: plataforma completa, coherente en todas sus capas, con la arquitectura de adaptadores validada como punto único de extensión para proveedores de inteligencia artificial futuros, y con las políticas de seguridad de datos verificadas en la totalidad del esquema de base de datos.

---

## 19. Cierre del Documento

Este blueprint constituye la especificación técnica completa y exhaustiva de la plataforma. Todo desarrollo posterior debe remitirse a este documento como fuente de verdad, respetando estrictamente los principios arquitectónicos, el stack tecnológico definido, la estructura de carpetas, el esquema de base de datos, la especificación de la API y las fases de implementación aquí descritas, sin introducir tecnologías, proveedores de automatización, proveedores de inteligencia artificial ni patrones arquitectónicos distintos a los establecidos.
