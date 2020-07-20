# AmoCRM integration libs

Здесь представлен сборник библиотек для интеграции с AmoCRM через OAuth.

# AmoCRM API

Чтобы добавить интеграцию с API, необходимо заполнить **все** поля и картинку.
В противном случае, интеграция не сохранится.

Для аутентификации используется *OAuth 2.0*.

Шаги аутентификации:
1. Создать интеграцию в CRM;
2. Вызвать специальный URL в течение 20 минут с ключом авторизации, чтобы 
получить токены;
3. Последующие запросы к API отправлять с хедером 
*Authorization: Bearer <Access Key>*.

# AmoCRM WebHooks

Смена этапа висит на хуке "Статус сделки изменен".

С AmoCRM приходит следующий JSON:
```json
{
    "leads[status][0][id]":"11111111",
    "leads[status][0][name]":"test",
    "leads[status][0][status_id]":"11111111",
    "leads[status][0][old_status_id]":"11111111",
    "leads[status][0][price]":"0",
    "leads[status][0][responsible_user_id]":"11111111",
    "leads[status][0][last_modified]":"11111111",
    "leads[status][0][modified_user_id]":"11111111",
    "leads[status][0][created_user_id]":"11111111",
    "leads[status][0][date_create]":"11111111",
    "leads[status][0][pipeline_id]":"11111111",
    "leads[status][0][account_id]":"11111111",
    "leads[status][0][created_at]":"11111111",
    "leads[status][0][updated_at]":"11111111",
    "account[subdomain]":"elbrusbootcamp",
    "account[id]":"11111111",
    "account[_links][self]":"https://elbrusbootcamp.amocrm.ru"
}
```

Как видно, отсюда невозможно получить детальную информацию о клиенте или этапе.
Поэтому данную информацию нужно грузить через API.

# AmoCRM Pipeline

Pipeline - это воронка продаж. Она состоит из этапов (statuses).

Ответ API воронки:

```json
{
    "_links": {
        "self": {
            "href": "/api/v2/pipelines?id=1309792",
            "method": "get"
        }
    },
    "_embedded": {
        "items": {
            "1309792": {
                "id": 1309792,
                "name": "Воронка",
                "sort": 1,
                "is_main": true,
                "statuses": {
                    "142": {
                        "id": 142,
                        "name": "ОПЛАЧНО",
                        "color": "#CCFF66",
                        "sort": 10000,
                        "is_editable": false
                    },
                    "143": {
                        "id": 143,
                        "name": "Отказ",
                        "color": "#D5D8DB",
                        "sort": 11000,
                        "is_editable": false
                    },
                    "21234445": {
                        "id": 21234445,
                        "name": "получен лид",
                        "color": "#e6e8ea",
                        "sort": 20,
                        "is_editable": true
                    },
                    "21234448": {
                        "id": 21234448,
                        "name": "позвонили клиенту",
                        "color": "#ffff99",
                        "sort": 40,
                        "is_editable": true
                    },
                    "21234451": {
                        "id": 21234451,
                        "name": "назначен ЭКЗАМЕН",
                        "color": "#ffcc66",
                        "sort": 80,
                        "is_editable": true
                    },
                    "21234454": {
                        "id": 21234454,
                        "name": "выставлен счет",
                        "color": "#deff81",
                        "sort": 90,
                        "is_editable": true
                    },
                    "22312969": {
                        "id": 22312969,
                        "name": "Отложено на неопределенный срок",
                        "color": "#ffc8c8",
                        "sort": 120,
                        "is_editable": true
                    },
                    "22695448": {
                        "id": 22695448,
                        "name": "лид в работе",
                        "color": "#ccc8f9",
                        "sort": 30,
                        "is_editable": true
                    },
                    "23052157": {
                        "id": 23052157,
                        "name": "Неразобранное",
                        "color": "#c1c1c1",
                        "sort": 10,
                        "is_editable": false
                    },
                    "24677734": {
                        "id": 24677734,
                        "name": "связаться позже",
                        "color": "#99ccff",
                        "sort": 110,
                        "is_editable": true
                    },
                    "25805773": {
                        "id": 25805773,
                        "name": "emailed pre-course",
                        "color": "#ffeab2",
                        "sort": 70,
                        "is_editable": true
                    },
                    "28668508": {
                        "id": 28668508,
                        "name": "Рассылка",
                        "color": "#fffeb2",
                        "sort": 130,
                        "is_editable": true
                    },
                    "29816575": {
                        "id": 29816575,
                        "name": "записан на event",
                        "color": "#fffd7f",
                        "sort": 50,
                        "is_editable": true
                    },
                    "29816578": {
                        "id": 29816578,
                        "name": "пришел на event",
                        "color": "#98cbff",
                        "sort": 60,
                        "is_editable": true
                    },
                    "29816581": {
                        "id": 29816581,
                        "name": "предоплата сделана",
                        "color": "#87f2c0",
                        "sort": 100,
                        "is_editable": true
                    }
                },
                "_links": {
                    "self": {
                        "href": "/api/v2/pipelines?id=1309792",
                        "method": "get"
                    }
                }
            }
        }
    }
}
```

# AmoCRM Contact

Contact - это данные контакта, привязанного к лиду.

Ответ JSON:

```json
{
    "_links": {
        "self": {
            "href": "/api/v2/contacts?id=46925315&entity=contacts",
            "method": "get"
        }
    },
    "_embedded": {
        "items": [
            {
                "id": 46925315,
                "name": "Тест Тестов Тестович",
                "first_name": "",
                "last_name": "",
                "responsible_user_id": 2772376,
                "created_by": 2772376,
                "created_at": 1574453110,
                "updated_at": 1574542269,
                "account_id": 21234439,
                "updated_by": 2772376,
                "group_id": 0,
                "company": {
                    "id": 46925333,
                    "name": "Тестовая комания",
                    "_links": {
                        "self": {
                            "href": "/api/v2/companies?id=46925333",
                            "method": "get"
                        }
                    }
                },
                "leads": {
                    "id": [
                        26331366
                    ],
                    "_links": {
                        "self": {
                            "href": "/api/v2/leads?id=26331366",
                            "method": "get"
                        }
                    }
                },
                "closest_task_at": 0,
                "tags": {},
                "custom_fields": [
                    {
                        "id": 384535,
                        "name": "Email",
                        "code": "EMAIL",
                        "values": [
                            {
                                "value": "test@elbrusboot.camp",
                                "enum": 748095
                            }
                        ],
                        "is_system": true
                    },
                    {
                        "id": 384533,
                        "name": "Телефон",
                        "code": "PHONE",
                        "values": [
                            {
                                "value": "+72323324234",
                                "enum": 748081
                            }
                        ],
                        "is_system": true
                    },
                    {
                        "id": 660009,
                        "name": "Опыт программирования",
                        "values": [
                            {
                                "value": "Pascal в школе"
                            }
                        ],
                        "is_system": false
                    },
                    {
                        "id": 384531,
                        "name": "Должность",
                        "code": "POSITION",
                        "values": [
                            {
                                "value": "капитан первого ранга"
                            }
                        ],
                        "is_system": true
                    },
                    {
                        "id": 384539,
                        "name": "Мгн. сообщения",
                        "code": "IM",
                        "values": [
                            {
                                "value": "testskype",
                                "enum": 748099
                            }
                        ],
                        "is_system": true
                    },
                    {
                        "id": 682005,
                        "name": "Facebook",
                        "values": [
                            {
                                "value": "http://testfacebook"
                            }
                        ],
                        "is_system": false
                    },
                    {
                        "id": 681999,
                        "name": "Имя в Facebook",
                        "values": [
                            {
                                "value": "testfacebookname"
                            }
                        ],
                        "is_system": false
                    },
                    {
                        "id": 682001,
                        "name": "Instagram",
                        "values": [
                            {
                                "value": "http://@test"
                            }
                        ],
                        "is_system": false
                    },
                    {
                        "id": 682011,
                        "name": "ВКонтакте",
                        "values": [
                            {
                                "value": "test@vk"
                            }
                        ],
                        "is_system": false
                    }
                ],
                "customers": {},
                "_links": {
                    "self": {
                        "href": "/api/v2/contacts?id=46925315",
                        "method": "get"
                    }
                }
            }
        ]
    }
}
```
