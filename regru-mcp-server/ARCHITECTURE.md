# Архитектура regru-mcp-server

Справочник по кодовой базе: где что лежит, как устроено, как добавлять новое.

---

## Структура файлов

```
regru-mcp-server/
├── src/
│   ├── index.ts              # Точка входа (CLI, stdio)
│   ├── server.ts             # Сборка сервера, регистрация всех инструментов
│   ├── api/
│   │   └── client.ts         # HTTP-клиент к Reg.ru API + типы ответов
│   ├── schemas/
│   │   └── common.ts         # Общие Zod-схемы (domain, subdomain, ttl, ...)
│   ├── tools/                # По одному файлу на инструмент MCP
│   │   ├── get-records.ts        → regru_get_dns_records
│   │   ├── get-services.ts       → regru_get_services
│   │   ├── check-availability.ts → regru_check_domain_availability
│   │   ├── add-alias.ts          → regru_add_a_record
│   │   ├── add-aaaa.ts           → regru_add_aaaa_record
│   │   ├── add-cname.ts          → regru_add_cname_record
│   │   ├── add-mx.ts             → regru_add_mx_record
│   │   ├── add-txt.ts            → regru_add_txt_record
│   │   ├── add-ns.ts             → regru_add_ns_record
│   │   ├── add-srv.ts            → regru_add_srv_record
│   │   ├── add-caa.ts            → regru_add_caa_record
│   │   ├── remove-record.ts      → regru_remove_record
│   │   ├── update-records.ts     → regru_update_records
│   │   ├── update-soa.ts         → regru_update_soa
│   │   ├── update-nss.ts         → regru_update_nss
│   │   ├── get-nss.ts            → regru_get_nss
│   │   └── clear-zone.ts         → regru_clear_zone
│   └── utils/
│       ├── formatter.ts      # Форматирование ответов в Markdown
│       └── errors.ts         # Человекочитаемые сообщения об ошибках
├── dist/                     # Скомпилированный JS (не трогать вручную)
├── package.json
└── tsconfig.json
```

---

## Точка входа и запуск

### `src/index.ts`
- Читает `REGRU_USERNAME` и `REGRU_PASSWORD` из `process.env`
- Вызывает `createServer()`, подключает `StdioServerTransport`
- Если переменные не заданы — падает с понятной ошибкой

### `src/server.ts` — `createServer(username, password): McpServer`
- Создаёт `McpServer` и один экземпляр `RegruClient`
- Вызывает `registerXxx(server, client)` для каждого инструмента
- **Сюда добавлять** импорт и вызов при добавлении нового инструмента

---

## API-клиент

### `src/api/client.ts`

#### Интерфейсы

| Интерфейс | Назначение |
|-----------|------------|
| `RegruApiResponse` | Базовый тип ответа от API (result, answer, error_code, ...) |
| `RegruService` | Элемент в `answer.services` (service_id, dname, servtype, state, ...) |
| `RegruApiClientError` | Класс ошибки с полем `apiError: RegruApiError` |

#### `RegruClient` — методы

| Метод | Endpoint API | Описание |
|-------|-------------|----------|
| `request(endpoint, params, options?)` | — | Базовый метод. Добавляет auth, отправляет POST, проверяет ошибки |
| `getResourceRecords(domain)` | `zone/get_resource_records` | DNS-записи домена |
| `getServiceList(servtype?)` | `service/get_list` | Список услуг аккаунта |
| `checkDomain(domain)` | `domain/check` | Проверка доступности одного домена |
| `checkDomains(domains[])` | `domain/check` | Проверка доступности нескольких доменов |
| `addAlias(domain, subdomain, ipaddr, ttl?)` | `zone/add_alias` | Добавить A-запись |
| `addAaaa(domain, subdomain, ipaddr, ttl?)` | `zone/add_aaaa` | Добавить AAAA-запись |
| `addCname(domain, subdomain, canonicalName, ttl?)` | `zone/add_cname` | Добавить CNAME |
| `addMx(domain, subdomain, mailServer, priority, ttl?)` | `zone/add_mx` | Добавить MX |
| `addTxt(domain, subdomain, text, ttl?)` | `zone/add_txt` | Добавить TXT |
| `addNs(domain, subdomain, dnsServer, ttl?)` | `zone/add_ns` | Добавить NS |
| `addSrv(domain, service, priority, weight, port, target, ttl?)` | `zone/add_srv` | Добавить SRV |
| `addCaa(domain, subdomain, flags, tag, value, ttl?)` | `zone/add_caa` | Добавить CAA |
| `removeRecord(domain, subdomain, recordType, content, priority?)` | `zone/remove_record` | Удалить запись |
| `updateRecords(domain, actions[])` | `zone/update_records` | Пакетное добавление/удаление |
| `updateSoa(domain, ttl?, minimumTtl?)` | `zone/update_soa` | Обновить SOA TTL |
| `updateNss(domain, nameservers[])` | `domain/update_nss` | Сменить NS домена (опц. glue-записи) |
| `getNss(domain)` | `domain/get_nss` | Получить текущие NS-серверы домена |
| `clearZone(domain)` | `zone/clear` | Очистить зону |

#### Обработка ошибок в `request()`
1. HTTP-статус не 2xx → `throw Error`
2. `data.result === "error"` → `throw RegruApiClientError`
3. `data.answer.domains[0].result === "error"` → `throw RegruApiClientError` (если не `skipDomainErrorCheck`)

#### `handleToolError(error)` (экспортируется)
Конвертирует любую ошибку в формат MCP-ответа `{ content, isError: true }`. Используется в каждом инструменте в `catch`.

---

## Схемы валидации

### `src/schemas/common.ts`

| Экспорт | Тип | Ограничения |
|---------|-----|-------------|
| `domainSchema` | `string` | 1–253 символа, regex FQDN |
| `subdomainSchema` | `string` | `@`, `*` или валидное имя, 1–253 символа |
| `ipv4Schema` | `string` | Regex IPv4 (0-255.0-255.0-255.0-255) |
| `ipv6Schema` | `string` | Regex IPv6, включая сжатую форму |
| `ttlSchema` | `number` | int, 60–86400, default 3600 |
| `prioritySchema` | `number` | int, 0–65535 |
| `recordTypeSchema` | `enum` | A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, SOA |

---

## Утилиты

### `src/utils/formatter.ts`

| Функция | Входные данные | Вывод |
|---------|---------------|-------|
| `formatRecordsAsMarkdown(domain, records[])` | `DnsRecord[]` | Markdown-таблица DNS-записей |
| `formatServiceList(services[])` | `ServiceInfo[]` | Markdown-таблица услуг |
| `formatDomainAvailability(domain, status)` | строки | Строка с индикатором ✓/✗ |
| `formatDomainAvailabilityList(results[])` | `{domain, status}[]` | Markdown-таблица доступности |
| `formatSuccessMessage(action, domain, details?)` | строки | Строка подтверждения |

### `src/utils/errors.ts`

| Функция/Интерфейс | Назначение |
|-------------------|------------|
| `RegruApiError` | Интерфейс ошибки из API |
| `formatApiError(error)` | Превращает код ошибки в читаемый текст (по таблице `ERROR_MESSAGES`) |
| `formatUnexpectedError(error)` | Обрабатывает сетевые ошибки (ECONNREFUSED, timeout и т.д.) |

Таблица кодов ошибок (`ERROR_MESSAGES`): `AUTH_ERROR`, `DOMAIN_NOT_FOUND`, `INVALID_DOMAIN_NAME`, `RECORD_ALREADY_EXISTS`, `ACCESS_DENIED`, `INVALID_IP_ADDRESS`, `TOO_MANY_REQUESTS`, `DOMAIN_BAD_NAME`, `NO_DOMAIN`, `SERVICE_UNAVAILABLE`.

---

## Все MCP-инструменты

| MCP Tool Name | Файл | API Endpoint | RO | Destructive |
|---------------|------|--------------|----|-------------|
| `regru_get_dns_records` | `tools/get-records.ts` | `zone/get_resource_records` | ✓ | — |
| `regru_get_services` | `tools/get-services.ts` | `service/get_list` | ✓ | — |
| `regru_check_domain_availability` | `tools/check-availability.ts` | `domain/check` | ✓ | — |
| `regru_add_a_record` | `tools/add-alias.ts` | `zone/add_alias` | — | — |
| `regru_add_aaaa_record` | `tools/add-aaaa.ts` | `zone/add_aaaa` | — | — |
| `regru_add_cname_record` | `tools/add-cname.ts` | `zone/add_cname` | — | — |
| `regru_add_mx_record` | `tools/add-mx.ts` | `zone/add_mx` | — | — |
| `regru_add_txt_record` | `tools/add-txt.ts` | `zone/add_txt` | — | — |
| `regru_add_ns_record` | `tools/add-ns.ts` | `zone/add_ns` | — | — |
| `regru_add_srv_record` | `tools/add-srv.ts` | `zone/add_srv` | — | — |
| `regru_add_caa_record` | `tools/add-caa.ts` | `zone/add_caa` | — | — |
| `regru_remove_record` | `tools/remove-record.ts` | `zone/remove_record` | — | ✓ |
| `regru_update_records` | `tools/update-records.ts` | `zone/update_records` | — | ✓ |
| `regru_update_soa` | `tools/update-soa.ts` | `zone/update_soa` | — | — |
| `regru_update_nss` | `tools/update-nss.ts` | `domain/update_nss` | — | ✓ |
| `regru_get_nss` | `tools/get-nss.ts` | `domain/get_nss` | ✓ | — |
| `regru_clear_zone` | `tools/clear-zone.ts` | `zone/clear` | — | ✓ |

---

## Паттерн: как устроен каждый инструмент

Все файлы в `tools/` следуют одному шаблону:

```typescript
// 1. Zod-схема входных параметров
const InputSchema = z.object({
  domain: domainSchema,
  // ...
}).strict();

type Input = z.infer<typeof InputSchema>;

// 2. Функция регистрации (вызывается из server.ts)
export function registerXxx(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_xxx",           // имя инструмента
    {
      title: "...",
      description: `...`, // описание для LLM, с примерами
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: boolean,
        destructiveHint: boolean,
        idempotentHint: boolean,
        openWorldHint: true,
      },
    },
    async (params: Input) => {
      try {
        const data = await client.xxx(params.domain, ...);
        return { content: [{ type: "text" as const, text: formatXxx(...) }] };
      } catch (error) {
        return handleToolError(error);  // всегда так
      }
    }
  );
}
```

---

## Как добавить новый инструмент

1. **Добавить метод в клиент** (`src/api/client.ts`):
   ```typescript
   async myMethod(domain: string, param: string): Promise<RegruApiResponse> {
     return this.request("zone/my_endpoint", { domain_name: domain, param });
   }
   ```

2. **Создать файл инструмента** `src/tools/my-tool.ts` по паттерну выше.

3. **Зарегистрировать в `src/server.ts`**:
   ```typescript
   import { registerMyTool } from "./tools/my-tool.js";
   // ...
   registerMyTool(server, client);
   ```

4. **Собрать**: `npm run build`

5. **Перезапустить Claude Code** (или MCP-клиент), чтобы подхватил новый инструмент.

> Если нужен новый формат ответа — добавить функцию в `src/utils/formatter.ts`.  
> Если нужна новая схема валидации — добавить в `src/schemas/common.ts`.

---

## Особенности API Reg.ru

- **Аутентификация**: `username` + `password` в теле каждого POST-запроса
- **Формат запроса**: `application/x-www-form-urlencoded`
- **Формат ответа**: JSON (`output_content_type: "plain"`)
- **Базовый URL**: `https://api.reg.ru/api/regru2/`
- **Лимит запросов**: 1200 в час на аккаунт и на IP
- **Таймаут**: 30 секунд
- **IP-ограничения**: API работает только с разрешённых IP (настраивается в ЛК Reg.ru)
- **Структура ответа DNS**: `answer.domains[0].rrs[]` — массив записей
- **Структура ответа услуг**: `answer.services[]`, имя домена в поле `dname`
