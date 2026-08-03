AntiGravity Prompt — Admin Category & Product Template Management Module
Objective

Design and implement a complete Admin Category & Product Template Management System for a global multi-vendor marketplace supporting both Physical and Digital products.

The system must be configuration-driven. Administrators should configure marketplace behaviour without requiring developers to modify product listing forms whenever a new category is added.

The UI must be modern, enterprise-grade, scalable, highly responsive, and suitable for marketplaces similar to Shopify, Amazon Seller Central, and Etsy.

Do not make assumptions. Every screen, section, button, field, validation, workflow, and interaction must follow the specifications below.

Core Business Architecture

The system must strictly separate these concepts.

Category

↓

Product Template

↓

Dynamic Product Listing Wizard

↓

Vendor Product Form

Never connect product fields directly with categories.

Categories only reference Product Templates.

Templates own the fields.

The Vendor Product Listing Form is generated dynamically from the assigned template.

Admin Panel Navigation

Create a completely independent navigation section named

Marketplace Configuration

Inside this section create:

Marketplace Configuration

├── Category Management

├── Product Templates

├── Additional Fields Library

├── Product Types

├── Template Assignment

├── Category Preview

These modules must remain independent.

Module 1
Category Management

Admin should manage marketplace hierarchy only.

Never configure fields here.

Features
Create Category
Edit Category
Delete Category
Archive Category
Restore Category
Search Category
Filter Category
Drag & Drop Reorder
Expand Collapse Tree

Every category contains

Category Name

Category Slug

Parent Category

Category Level

Category Status

Supported Product Types

Assigned Product Template

Category Icon

Category Image

Display Order

Visibility

SEO Meta Title

SEO Description

Never ask Admin to configure product fields inside Category Management.

Hierarchy UI

Books & Literature

    History

        Sikh Empire

    Sikhism

        Gurbani Studies

Art & Decor

    Wall Art

        Canvas Paintings

Support three visible hierarchy levels.

Internally use parent-child relationships.

Never hardcode levels.

Module 2
Product Templates

This is the most important module.

A Product Template defines the complete listing experience.

One template can be reused by unlimited categories.

Admin should create

Books Template

Art Template

Accessories Template

Fashion Template

Digital Product Template

Future templates can also be created.

Each template contains

Template Name

Description

Supported Product Types

Status

Each template contains Wizard Steps.

Default example

Basic Information

Category Specific Details

Pricing

Inventory

Shipping

Media

SEO

Review

Publish

Wizard steps must be configurable.

Allow

Add

Delete

Rename

Reorder

Disable

Template Sections

Each Wizard Step contains Sections.

Example

Basic Information

General

Brand

Description
Pricing

Price

Tax

Discount
Media

Images

Videos

Documents

Sections should support

Add

Delete

Rename

Move
Template Fields

Every Section contains Fields.

Each field supports

Field Name

Label

Placeholder

Help Text

Description

Field Type

Required

Read Only

Default Value

Validation Rules

Display Order

Visibility Rules

Supported Field Types

Text

Textarea

Rich Text

Number

Decimal

Currency

Date

Time

Checkbox

Radio

Toggle

Dropdown

Multi Select

Image Upload

Video Upload

Document Upload

Color Picker

Dimension

Weight

SKU

Barcode

URL

Email

Phone

No assumptions.

All field types must be configurable.

Validation

Support

Required

Minimum Length

Maximum Length

Minimum Value

Maximum Value

Regex

Unique

Custom Validation Message

Conditional Visibility

Support

Show

Hide

Enable

Disable

Based on

Product Type

Category

Previous Field

Dropdown Value

Toggle

Checkbox
Module 3
Additional Fields Library

This module manages reusable fields.

Purpose

Avoid creating duplicate fields.

Example

Author

ISBN

Language

Publisher

Artist

Material

Dimensions

Certificate Number

Admin can

Create

Edit

Delete

Search

Assign

These fields can later be attached to categories.

Module 4
Product Types

Create configurable product types.

Initially

Physical

Digital

Both

Future product types should be supported.

Each product type controls

Inventory

Shipping

Downloads

Licensing

Media

Variants

Example

Physical

Inventory

Shipping

Weight

Pickup

Digital

Download File

License

Preview

Activation
Module 5
Template Assignment

Admin creates category.

System asks

Category Name

Parent

Supported Product Types

Assign Product Template

Example

Books & Literature

↓

Books Template
History

↓

Books Template
Punjabi Literature

↓

Books Template

No duplicate template creation.

Module 6
Category Additional Fields

Some categories require extra information.

Never duplicate templates.

Instead

Allow

Books Template

+

Additional Fields

Example

Rare Manuscripts

↓

Century

Original Script

Condition

System automatically merges

Books Template

+

Additional Fields

Generated Vendor Form

Author

ISBN

Publisher

Language

Century

Original Script

Condition

No template duplication.

Module 7
Vendor Product Listing

Vendor should never know templates exist.

Vendor Flow

Add Product

↓

Select Category

↓

System reads Assigned Template

↓

System merges Additional Fields

↓

Dynamic Wizard Generated

↓

Vendor fills Product

↓

Publish

Vendor must never configure templates.

Books Example

Create a reusable

Books Template

Containing

Basic Information

Book Details

Pricing

Inventory

Media

SEO

Review

Book Details

Author

Publisher

ISBN

Edition

Language

Pages

Binding

Publication Date

Create Categories

Books & Literature

↓

History

↓

Sikh Empire

All three categories reuse

Books Template

Now create

Rare Manuscripts

Attach Additional Fields

Century

Original Script

Condition

Final Vendor Form becomes

Author

Publisher

ISBN

Edition

Language

Pages

Binding

Publication Date

Century

Original Script

Condition

without modifying the original Books Template.

Permissions

Create dedicated roles.

Super Admin

Marketplace Admin

Template Manager

Only

Template Manager

Super Admin

can

Create Templates

Edit Templates

Delete Templates

Marketplace Admin can

Create Categories

Assign Templates

Attach Additional Fields
UI Requirements
Enterprise dashboard design.
Responsive desktop-first layout.
Tree view for categories.
Drag-and-drop ordering.
Search, filters, pagination.
Confirmation dialogs for destructive actions.
Empty, loading, success, and error states.
Consistent spacing, typography, and component styling across all modules.
Strict Rules
Never create product fields directly inside Category Management.
Never duplicate templates for similar categories.
Categories only reference templates.
Vendor forms must always be generated dynamically from the assigned template plus any additional fields.
Support both Physical and Digital product types.
Keep the architecture modular, reusable, and scalable.
Do not invent additional workflows or UI patterns beyond what is specified.
If any information is not explicitly defined in this prompt, leave it configurable rather than making assumptions.


also check the belows stuff
Achievability Assessment
Architecture coverage: 
Functional flow coverage: 
UI coverage: 