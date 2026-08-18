---
title: "Digital Invoicing"
company: "Fegora"
role: "Co-Founder & Software Architect"
summary: "Fegora is an innovative digital invoicing service and platform designed specifically for companies and contributors in Central America. It streamlines the invoicing process, offering users a comprehensive solution to manage their financial transactions with ease and efficiency."
date: 2011-08-01
end: present
inProduction: true
hero: "../../assets/projects/fegora-digital-invoicing/fegora-showcase-cuadrado.png"
heroAlt: "Overlapping Fegora screens: a list of issued invoices, one certified invoice, its signed XML, an emailed notification, and the REST API reference."
tech:
  - ".NET"
  - "C#"
  - "LLBLGen Pro"
  - "Microsoft SQL Server"
  - "Oracle"
  - "MySQL"
  - "PostgreSQL"
  - "Visual Studio"
  - "REST APIs"
source: "https://theseusthread.com/showcase/fegora-digital-invoicing/"
---
## **Co-Founder and Software Architect at Fegora**


**Description:**  
I co-founded **Fegora**, a pioneering digital invoicing platform that streamlined electronic invoicing processes for businesses in Guatemala and beyond. As a Software Architect, I designed and implemented scalable and innovative solutions that connected enterprise systems to the **Superintendency of Tax Administration (SAT)**, ensuring seamless compliance with government regulations.

**Key Contributions:**

-   **Software Architecture:** Designed and developed a robust, scalable architecture for digital invoicing services, ensuring high availability and fault tolerance.
-   **Regulatory Compliance:** Collaborated closely with the SAT to maintain compliance with evolving tax laws and standards, keeping client businesses operational and audit-ready.
-   **Client Integration:** Implemented flexible APIs and integration tools to connect Fegora’s platform with diverse client systems, enabling smooth adoption across various industries.
-   **User-Centric Features:** Developed intuitive user interfaces and tools that allowed businesses to efficiently manage invoicing, reporting, and document archiving.

![The Fegora API reference for authentication: endpoint list on the left, request headers and body in the middle, and example cURL requests with JSON responses on the right.](../../assets/projects/fegora-digital-invoicing/api-1.jpg)

![API reference for creating a commercial invoice, with the document-type endpoints listed down the left and the JSON request body for the recipient on the right.](../../assets/projects/fegora-digital-invoicing/fegora-create-invoice-postman-1.png)

![The signed XML of a Guatemalan electronic tax document, showing the SAT schema namespaces and the XML digital signature block.](../../assets/projects/fegora-digital-invoicing/fegora-single-invoice-xml2-1.png)

**Key Achievements:**

-   Successfully scaled Fegora to handle high transaction volumes across multiple businesses.
-   Built a foundation that facilitated the platform's eventual acquisition, showcasing its market value and technological innovation.
-   Provided 15 years of technical customer support, ensuring a high level of client satisfaction and retention.
-   Created **custom LLBLGen Pro templates** and tools that optimized database design and performance for invoicing workflows.

![Fegora's electronic document list: date, status and establishment filters above a table of issued invoices with recipients and totals in quetzales.](../../assets/projects/fegora-digital-invoicing/fegora-invoices-filter-1.png)

![A single certified invoice, showing issuer and recipient tax details, four line items and a total of 975 quetzales, with buttons to download the PDF or void it.](../../assets/projects/fegora-digital-invoicing/fegora-single-invoice-1.png)

![An automated Fegora email notifying a customer that electronic documents have been issued, with a link to each one.](../../assets/projects/fegora-digital-invoicing/fegora-single-invoice-mail-1.png)

**Impact:**  
Fegora revolutionized the invoicing landscape in Guatemala by providing businesses with a reliable, secure, and user-friendly platform for managing their digital invoices. My leadership and technical expertise were instrumental in establishing Fegora as a trusted name in the digital invoicing sector, empowering companies to transition to a digital-first approach.

With Fegora, businesses benefit from a robust RESTful API that allows for seamless integration with various applications and systems. The platform features a user-friendly web front that simplifies the invoicing experience, enabling users to create, send, and manage invoices effortlessly.

Fegora also excels in reporting capabilities, providing detailed insights into invoicing patterns and financial performance, which can help businesses make informed decisions. It supports a multitude of connector channels, including SMTP and SFTP for secure data transmission, as well as message queues for efficient processing.

* * *

Moreover, Fegora is compatible with a wide range of ERP systems, including SAP, Netsuite, Microsoft Dynamics, Odoo, Salesforce, and Shopify ensuring that companies can integrate their existing workflows without disruption. To facilitate development and customization, Fegora offers programming language client connectors for popular languages like .NET, JavaScript, Oracle PL/SQL, Python, and Ruby on Rails.

Overall, Fegora empowers Central American businesses and contributors to optimize their invoicing processes, improve cash flow management, and enhance operational efficiency through its versatile and reliable digital invoicing platform.

## API and open-source connectors

**[Fegora API reference](https://developer.fegora.com/)**

<p lang="es">Fegora hace accesible de una manera muy fácil la utilización de un API para realizar operaciones relacionadas con Facturación Electrónica en Línea (FEL). Dicho API está basado en un servicio REST con formato JSON para el intercambio de información. La configuración previa de la cuenta, hace que los datos que se deban enviar sean los estrictamente necesarios. Los cálculos, frases, firmas y demás complementos solicitados en los esquemas de SAT, son construidos, validados y sellados por el API de Fegora y el Certificador en cuestión. De manera inmediata se devuelve el documento certificado, con enlaces a los archivos XML y PDF para que la aplicación que se conecte los pueda bajar o guardar para posterior consulta de los receptores. A continuación se muestran los endpoints que expone el API, con algunos ejemplos adicionales para cada uno.</p>

**[Estructura DTE](https://github.com/fegora/fegora.github.io/wiki/Estructura-DTE)** — the JSON document structure the API accepts.

**[fegora-dotnet](https://github.com/fegora/fegora-dotnet)** — client library for .NET 4.5 and above.
