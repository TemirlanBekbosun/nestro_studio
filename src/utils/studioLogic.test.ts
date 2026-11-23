import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppInquiryUrl,
  calculateProjectEstimate,
  clampPagesForFormat,
  formatKgs,
  isSafeHttpUrl,
  validateInquiryForm,
} from './studioLogic.ts';

test('single-page baseline uses 5 000 сом per page', () => {
  const result = calculateProjectEstimate({
    formatId: 'single-page',
    pagesCount: 1,
    automations: [],
  });
  assert.equal(result.pagesCount, 1);
  assert.equal(result.pagesCostKgs, 5000);
  assert.equal(result.totalKgs, 5000);
});

test('multi-page estimate scales at 5 000 сом per page plus automations', () => {
  const result = calculateProjectEstimate({
    formatId: 'multi-page',
    pagesCount: 5,
    automations: ['whatsapp-telegram', 'crm-sync'],
  });
  assert.equal(result.pagesCount, 5);
  assert.equal(result.pagesCostKgs, 25000);
  assert.equal(result.automationsCostKgs, 7500);
  assert.equal(result.totalKgs, 32500);
  assert.equal(result.selectedAutomationLabels.length, 2);
});

test('clampPagesForFormat enforces format page bounds', () => {
  assert.equal(clampPagesForFormat('single-page', 10), 2);
  assert.equal(clampPagesForFormat('multi-page', 1), 3);
  assert.equal(clampPagesForFormat('catalog', 2), 4);
});

test('validateInquiryForm catches missing required fields and accepts valid contact', () => {
  const invalid = validateInquiryForm({
    name: 'А',
    company: '',
    businessSphere: '',
    contact: '123',
    formatId: 'single-page',
    pagesCount: 1,
    automations: [],
    budgetLabel: '',
    taskDescription: 'коротко',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.businessSphere);
  assert.ok(invalid.errors.contact);
  assert.ok(invalid.errors.taskDescription);

  const valid = validateInquiryForm({
    name: 'Азамат',
    company: 'Optika Pro',
    businessSphere: 'Оптика и розничная торговля',
    contact: '+996 555 123 456',
    formatId: 'multi-page',
    pagesCount: 4,
    automations: ['crm-sync'],
    budgetLabel: '25 000 сом',
    taskDescription: 'Нужен каталог оправ и автоматическая передача заявок в CRM.',
  });
  assert.equal(valid.valid, true);
});

test('buildWhatsAppInquiryUrl produces valid encoded wa.me URL', () => {
  const input = {
    name: 'Айгуль',
    company: 'DreamDay',
    businessSphere: 'Ивент-агентство',
    contact: '+996 700 112 233',
    formatId: 'multi-page' as const,
    pagesCount: 5,
    automations: ['whatsapp-telegram' as const],
    budgetLabel: '30 000 сом',
    taskDescription: 'Нужен многостраничный сайт с портфолио и формой расчёта.',
  };
  const estimate = calculateProjectEstimate(input);
  const url = buildWhatsAppInquiryUrl('+996 555 000 111', input, estimate);
  assert.ok(url.startsWith('https://wa.me/996555000111?text='));
  assert.ok(decodeURIComponent(url).includes('Айгуль'));
  assert.ok(decodeURIComponent(url).includes('27 500 сом'));
});

test('formatKgs formats thousands with spaces and currency', () => {
  assert.equal(formatKgs(25000), '25 000 сом');
});

test('isSafeHttpUrl rejects javascript: URLs and allows https', () => {
  assert.equal(isSafeHttpUrl('https://pulse.kg/'), true);
  assert.equal(isSafeHttpUrl('/uploads/demo.png'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
});
