import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { readFileSync } from 'fs';
import { test, before, after } from 'node:test';

const R = new URL('../', import.meta.url).pathname;
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'kian-test',
    firestore: { rules: readFileSync(R + 'firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync(R + 'storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  });
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'articles/pub'), { title: 'a', published: true });
    await setDoc(doc(db, 'articles/draft'), { title: 'b', published: false });
    await setDoc(doc(db, 'storeProducts/p1'), { title: 'منتج', price: 25, currency: 'USD', published: true });
    await setDoc(doc(db, 'storeProducts/p2'), { title: 'مسودة', price: 10, published: false });
    await setDoc(doc(db, 'storeProducts/p3'), { title: 'كسري', price: 9.99, published: true });
    await setDoc(doc(db, 'siteSettings/main'), { brand: 'كيان' });
    await setDoc(doc(db, 'purchaseRequests/alice1'), { customerUid: 'alice', status: 'new' });
    await setDoc(doc(db, 'purchaseRequests/bob1'), { customerUid: 'bob', status: 'new' });
    await setDoc(doc(db, 'contactMessages/m1'), { name: 'x' });
    await setDoc(doc(db, 'secret/x'), { a: 1 });
    const st = c.storage();
    await uploadBytes(ref(st, 'products/p1/preview/img'), new Uint8Array([1]), { contentType: 'image/png' });
    await uploadBytes(ref(st, 'products/p1/file/f.zip'), new Uint8Array([1]), { contentType: 'application/zip' });
    await uploadBytes(ref(st, 'site/hero/h'), new Uint8Array([1]), { contentType: 'image/png' });
  });
});
after(async () => env && env.cleanup());

const anon = () => env.unauthenticatedContext();
const admin = () => env.authenticatedContext('adminUid', { email: 'smthysan@gmail.com' });
const alice = () => env.authenticatedContext('alice', { email: 'alice@x.com' });
const fakeAdmin = () => env.authenticatedContext('evil', { email: 'smthysan@gmail.com.evil.com' });
const order = (o = {}) => ({ customerUid: 'alice', customerEmail: 'alice@x.com', productId: 'p1', productTitle: 'منتج', amount: 25, currency: 'USD', country: 'اليمن', company: '', message: '', status: 'new', createdAt: serverTimestamp(), ...o });
const msg = (o = {}) => ({ name: 'أحمد', email: 'a@b.co', phone: '', subject: '', message: 'مرحبا أريد موقعا', page: '/contact', status: 'new', createdAt: serverTimestamp(), ...o });

test('content: public reads published only', async () => {
  const db = anon().firestore();
  await assertSucceeds(getDoc(doc(db, 'articles/pub')));
  await assertFails(getDoc(doc(db, 'articles/draft')));
  await assertSucceeds(getDocs(query(collection(db, 'articles'), where('published', '==', true))));
  await assertSucceeds(getDocs(query(collection(db, 'articles'), where('slug', '==', 'x'), where('published', '==', true))));
  await assertFails(getDocs(collection(db, 'articles')));
});
test('content: only admin writes; admin reads drafts', async () => {
  await assertFails(setDoc(doc(anon().firestore(), 'articles/n'), { published: true }));
  await assertFails(setDoc(doc(alice().firestore(), 'articles/n'), { published: true }));
  await assertFails(setDoc(doc(fakeAdmin().firestore(), 'articles/n'), { published: true }));
  await assertSucceeds(setDoc(doc(admin().firestore(), 'articles/n'), { published: false }));
  await assertSucceeds(getDoc(doc(admin().firestore(), 'articles/draft')));
  await assertSucceeds(getDocs(collection(admin().firestore(), 'articles')));
  await assertSucceeds(deleteDoc(doc(admin().firestore(), 'articles/n')));
});
test('siteSettings + logs', async () => {
  await assertSucceeds(getDoc(doc(anon().firestore(), 'siteSettings/main')));
  await assertFails(setDoc(doc(alice().firestore(), 'siteSettings/main'), { brand: 'x' }));
  await assertSucceeds(setDoc(doc(admin().firestore(), 'siteSettings/main'), { brand: 'كيان' }, { merge: true }));
  const a = admin().firestore();
  const r = await assertSucceeds(addDoc(collection(a, 'adminActivityLogs'), { action: 'create', createdAt: serverTimestamp() }));
  await assertFails(updateDoc(r, { action: 'x' }));
  await assertFails(deleteDoc(r));
  await assertFails(getDocs(collection(alice().firestore(), 'adminActivityLogs')));
});
test('purchaseRequests: valid create', async () => {
  await assertSucceeds(addDoc(collection(alice().firestore(), 'purchaseRequests'), order()));
  await assertSucceeds(addDoc(collection(alice().firestore(), 'purchaseRequests'), order({ productId: 'p3', amount: 9.99, company: 'شركة', message: 'ملاحظة' })));
});
test('purchaseRequests: invalid creates rejected', async () => {
  const db = alice().firestore();
  for (const bad of [
    order({ customerUid: 'bob' }), order({ customerEmail: 'other@x.com' }), order({ amount: 1 }),
    order({ productId: 'p2', amount: 10 }), order({ productId: 'nope' }), order({ status: 'completed' }),
    order({ createdAt: new Date() }), order({ country: '' }), order({ hacked: true }), order({ message: 'x'.repeat(2001) }),
  ]) await assertFails(addDoc(collection(db, 'purchaseRequests'), bad));
  await assertFails(addDoc(collection(anon().firestore(), 'purchaseRequests'), order()));
});
test('purchaseRequests: read/update scope', async () => {
  const db = alice().firestore();
  await assertSucceeds(getDoc(doc(db, 'purchaseRequests/alice1')));
  await assertFails(getDoc(doc(db, 'purchaseRequests/bob1')));
  await assertSucceeds(getDocs(query(collection(db, 'purchaseRequests'), where('customerUid', '==', 'alice'))));
  await assertFails(getDocs(collection(db, 'purchaseRequests')));
  await assertFails(updateDoc(doc(db, 'purchaseRequests/alice1'), { status: 'completed' }));
  await assertSucceeds(updateDoc(doc(admin().firestore(), 'purchaseRequests/alice1'), { status: 'completed', updatedAt: serverTimestamp() }));
  await assertSucceeds(getDocs(collection(admin().firestore(), 'purchaseRequests')));
});
test('subscribers', async () => {
  const db = anon().firestore();
  const sub = (o = {}) => ({ email: 'a@b.co', source: 'article', consent: true, status: 'active', createdAt: serverTimestamp(), ...o });
  await assertSucceeds(setDoc(doc(db, 'subscribers/a@b.co'), sub()));
  await assertFails(setDoc(doc(db, 'subscribers/a@b.co'), sub()));                                  // مشترك موجود: لا تعديل
  await assertFails(setDoc(doc(db, 'subscribers/other@b.co'), sub()));                              // المعرّف يطابق البريد فقط
  await assertFails(setDoc(doc(db, 'subscribers/Upper@b.co'), sub({ email: 'Upper@b.co' })));       // حروف كبيرة مرفوضة
  await assertSucceeds(setDoc(doc(db, 'subscribers/up@b.co'), sub({ email: 'up@b.co' })));
  await assertFails(setDoc(doc(db, 'subscribers/c@d.co'), sub({ email: 'c@d.co', consent: false })));
  await assertFails(setDoc(doc(db, 'subscribers/c@d.co'), sub({ email: 'c@d.co', status: 'unsubscribed' })));
  await assertFails(setDoc(doc(db, 'subscribers/c@d.co'), sub({ email: 'c@d.co', extra: 1 })));
  await assertFails(setDoc(doc(db, 'subscribers/c@d.co'), sub({ email: 'c@d.co', createdAt: new Date() })));
  await assertFails(setDoc(doc(db, 'subscribers/bad'), sub({ email: 'bad' })));
  await assertFails(getDoc(doc(db, 'subscribers/a@b.co')));                                         // الزائر لا يقرأ القائمة
  await assertFails(getDocs(collection(db, 'subscribers')));
  await assertFails(getDocs(collection(alice().firestore(), 'subscribers')));
  await assertFails(getDocs(collection(fakeAdmin().firestore(), 'subscribers')));
  await assertSucceeds(getDocs(collection(admin().firestore(), 'subscribers')));
  await assertSucceeds(updateDoc(doc(admin().firestore(), 'subscribers/a@b.co'), { status: 'unsubscribed' }));
  await assertSucceeds(deleteDoc(doc(admin().firestore(), 'subscribers/a@b.co')));
});
test('contactMessages', async () => {
  const db = anon().firestore();
  await assertSucceeds(addDoc(collection(db, 'contactMessages'), msg()));
  await assertSucceeds(addDoc(collection(db, 'contactMessages'), msg({ message: 'أريد موقعاً' })));            // 10 حروف عربية
  await assertSucceeds(addDoc(collection(db, 'contactMessages'), msg({ message: 'ع'.repeat(5000) })));         // الحد الأقصى بالعربية
  await assertSucceeds(addDoc(collection(alice().firestore(), 'contactMessages'), msg({ uid: 'alice' })));
  for (const bad of [msg({ email: 'bad' }), msg({ message: 'قصير' }), msg({ name: 'x' }), msg({ status: 'read' }), msg({ extra: 1 }),
    msg({ uid: 'alice' }), msg({ createdAt: new Date() }), msg({ message: 'ع'.repeat(5001) })])
    await assertFails(addDoc(collection(db, 'contactMessages'), bad));
  await assertFails(getDoc(doc(db, 'contactMessages/m1')));
  await assertFails(getDocs(collection(alice().firestore(), 'contactMessages')));
  await assertSucceeds(getDocs(collection(admin().firestore(), 'contactMessages')));
  await assertSucceeds(updateDoc(doc(admin().firestore(), 'contactMessages/m1'), { status: 'read' }));
  await assertSucceeds(deleteDoc(doc(admin().firestore(), 'contactMessages/m1')));
});
test('default deny', async () => {
  await assertFails(getDoc(doc(admin().firestore(), 'secret/x')));
  await assertFails(setDoc(doc(anon().firestore(), 'x/y'), { a: 1 }));
});
test('storage', async () => {
  const s = anon().storage(), a = admin().storage(), u = alice().storage();
  await assertSucceeds(getBytes(ref(s, 'products/p1/preview/img')));
  await assertSucceeds(getBytes(ref(s, 'site/hero/h')));
  await assertFails(getBytes(ref(s, 'products/p1/file/f.zip')));
  await assertFails(getBytes(ref(a, 'products/p1/file/f.zip')));
  await assertFails(uploadBytes(ref(u, 'articles/x/preview/i'), new Uint8Array([1]), { contentType: 'image/png' }));
  await assertSucceeds(uploadBytes(ref(a, 'articles/x/preview/i'), new Uint8Array([1]), { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(a, 'articles/x/preview/j'), new Uint8Array([1]), { contentType: 'text/html' }));
  await assertSucceeds(uploadBytes(ref(a, 'site/hero/k'), new Uint8Array([1]), { contentType: 'image/jpeg' }));
  await assertSucceeds(uploadBytes(ref(a, 'products/p1/file/g.apk'), new Uint8Array([1]), { contentType: 'application/vnd.android.package-archive' }));
  await assertFails(uploadBytes(ref(u, 'products/p1/file/g.apk'), new Uint8Array([1]), { contentType: 'application/zip' }));
  await assertSucceeds(deleteObject(ref(a, 'articles/x/preview/i')));
  await assertFails(uploadBytes(ref(a, 'other/x'), new Uint8Array([1]), { contentType: 'image/png' }));
});
