document.addEventListener('DOMContentLoaded', function() {

  // ربط أزرار التنقل بالدوال الخاصة بها
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // المتطلب الأول: الاستماع لحدث إرسال النموذج (Submit Form)
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // بشكل افتراضي، قم بتحميل صندوق الوارد
  load_mailbox('inbox');
});

function compose_email() {
  // إظهار واجهة الكتابة وإخفاء الواجهات الأخرى
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // تفريغ الحقول تماماً عند فتح رسالة جديدة
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

// دالة المتطلب الأول: إرسال البريد الإلكتروني عبر API
function send_email(event) {
  event.preventDefault(); // منع الصفحة من إعادة التحميل الافتراضية

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // بعد الإرسال بنجاح، نقوم بتحميل صندوق الرسائل المرسلة (Sent)
      load_mailbox('sent');
  })
  .catch(error => {
      console.log('Error:', error);
  });
}

// دالة المتطلب الثاني: جلب وعرض الرسائل داخل الصناديق
function load_mailbox(mailbox) {

  // التحكم بالواجهات المرئية
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

  // عرض اسم الصندوق في الأعلى
  document.querySelector('#emails-view').innerHTML = `<h3 class="mb-4 text-capitalize">${mailbox}</h3>`;

  // جلب الرسائل الخاصة بالصندوق الحالي من الـ API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      if (emails.length === 0) {
          document.querySelector('#emails-view').innerHTML += `<div class="alert alert-info">This mailbox is empty.</div>`;
          return;
      }

      // بناء وتصميم كل رسالة على حدة
      emails.forEach(email => {
          const emailDiv = document.createElement('div');

          // تحديد الصنف بناءً على حالة القراءة (مقرؤة أم لا) ليتغير لون الخلفية عبر الـ CSS
          emailDiv.className = `email-box ${email.read ? 'read-email' : 'unread-email'}`;

          emailDiv.innerHTML = `
              <div class="email-content">
                  <span class="email-sender">${mailbox === 'sent' ? 'To: ' + email.recipients.join(', ') : email.sender}</span>
                  <span class="email-subject">${email.subject}</span>
              </div>
              <span class="email-timestamp">${email.timestamp}</span>
          `;

          // المتطلب الثالث: عند الضغط على الرسالة، يتم الانتقال لعرض تفاصيلها بالكامل
          emailDiv.addEventListener('click', () => view_email(email.id, mailbox));

          document.querySelector('#emails-view').append(emailDiv);
      });
  })
  .catch(error => console.log('Error fetching emails:', error));
}

// دالة المتطلب الثالث: عرض الرسالة الواحدة بالكامل وتحويل حالتها إلى "مقروءة"
function view_email(email_id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  const singleView = document.querySelector('#single-email-view');
  singleView.style.display = 'block';
  singleView.innerHTML = ''; // تنظيف الواجهة قبل العرض

  // جلب تفاصيل الرسالة المحددة
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

      // تعديل حالة الرسالة إلى مقروءة (Read: true) عبر طلب PUT
      if (!email.read) {
          fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({ read: true })
          });
      }

      // تجهيز أزرار الأرشفة والرد ديناميكياً
      // المتطلب الرابع: زر الأرشفة يظهر فقط إذا لم تكن الرسالة في صندوق الصادر (Sent)
      let archiveBtnHTML = '';
      if (mailbox !== 'sent') {
          const btnText = email.archived ? 'Unarchive' : 'Archive';
          const btnClass = email.archived ? 'btn-warning' : 'btn-secondary';
          archiveBtnHTML = `<button class="btn ${btnClass} action-btn" id="archive-btn">${btnText}</button>`;
      }

      // هيكلة محتوى تفاصيل الرسالة بشكل أنيق وجميل جداً لديفيد
      singleView.innerHTML = `
          <div class="email-details-header">
              <p><strong>From:</strong> ${email.sender}</p>
              <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
              <p><strong>Subject:</strong> ${email.subject}</p>
              <p><strong>Timestamp:</strong> ${email.timestamp}</p>
              <hr>
              <button class="btn btn-info action-btn" id="reply-btn">Reply</button>
              ${archiveBtnHTML}
          </div>
          <div class="email-body-content">${email.body}</div>
      `;

      // إضافة المنطق البرمجي لزر الأرشفة/إلغاء الأرشفة إن وُجد
      if (mailbox !== 'sent') {
          document.querySelector('#archive-btn').addEventListener('click', () => {
              fetch(`/emails/${email_id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ archived: !email.archived })
              })
              .then(() => load_mailbox('inbox')); // العودة لصندوق الوارد بعد التعديل
          });
      }

      // المتطلب الخامس: منطق تفعيل زر الرد (Reply) وتجهيز البيانات تلقائياً
      document.querySelector('#reply-btn').addEventListener('click', () => {
          compose_email();

          // ملء حقل المستلم بمرسل الرسالة الأصلية
          document.querySelector('#compose-recipients').value = email.sender;

          // صياغة عنوان الرد بذكاء (إضافة Re: إن لم تكن موجودة)
          let subject = email.subject;
          if (!subject.startsWith('Re: ')) {
              subject = `Re: ${subject}`;
          }
          document.querySelector('#compose-subject').value = subject;

          // صياغة نص الرسالة السابقة في خانة الـ Body بشكل منظم
          document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n"${email.body}"\n\n`;
      });
  })
  .catch(error => console.log('Error viewing email:', error));
}