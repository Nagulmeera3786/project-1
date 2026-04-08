from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from .models import (
    SMSMessage,
    SMSCredential,
    SMSContactGroup,
    SMSContact,
    SMSShortURL,
    InternalNotification,
    InternalNotificationRecipient,
)

User = get_user_model()

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True,
                                     validators=[validate_password])
    first_name = serializers.CharField(required=True, allow_blank=False)
    phone_number = serializers.CharField(required=True, allow_blank=False)
    
    class Meta:
        model = User
        fields = ('id', 'first_name', 'username', 'email', 'phone_number', 'password')

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            phone_number=validated_data['phone_number']
        )
        user.set_password(validated_data['password'])
        user.is_active = False
        user.save()
        return user

class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class SMSMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient_user.username', read_only=True)
    transport = serializers.SerializerMethodField()

    def get_transport(self, obj):
        message_id = str(getattr(obj, 'message_id', '') or '').lower()
        failure_reason = str(getattr(obj, 'failure_reason', '') or '').lower()
        sms_type = str(getattr(obj, 'sms_type', '') or '').lower()

        # Keep this future-proof for multi-channel messages.
        if sms_type == 'whatsapp':
            return 'whatsapp'

        if message_id.startswith('smpp-') or 'smpp' in failure_reason:
            return 'smpp'

        return 'api'

    class Meta:
        model = SMSMessage
        fields = [
            'id', 'sender', 'sender_username', 'recipient_number', 'recipient_user',
            'recipient_username', 'display_sender_id', 'message_content', 'sms_type',
            'transport',
            'send_mode', 'schedule_type', 'scheduled_at', 'timezone_name',
            'batch_reference', 'source_file_name', 'status', 'message_id',
            'failure_reason', 'delivery_time', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'message_id', 'delivery_time', 'created_at', 'updated_at',
            'status', 'failure_reason'
        ]


class SMSSendSerializer(serializers.Serializer):
    transport = serializers.ChoiceField(choices=['api', 'smpp'], default='api', required=False)
    smpp_profile = serializers.ChoiceField(choices=['standard', 'dlt'], default='standard', required=False)
    display_sender_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    sender_id = serializers.CharField(max_length=50, required=False, allow_blank=True, write_only=True)
    message_content = serializers.CharField(max_length=160)
    sms_type = serializers.ChoiceField(
        choices=[choice[0] for choice in SMSMessage.SMS_TYPE_CHOICES],
        default='transactional',
        required=False,
    )
    send_mode = serializers.ChoiceField(
        choices=[choice[0] for choice in SMSMessage.SEND_MODE_CHOICES],
        default='single',
        required=False,
    )

    recipient_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    recipient_user_id = serializers.IntegerField(required=False, allow_null=True)
    group_id = serializers.IntegerField(required=False, allow_null=True)

    delivery_mode = serializers.ChoiceField(choices=['instant', 'scheduled'], default='instant', required=False)
    timezone_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    start_date = serializers.DateField(required=False)
    start_time = serializers.TimeField(required=False)

    source_file = serializers.FileField(required=False, allow_null=True)

    smpp_host = serializers.CharField(max_length=255, required=False, allow_blank=True, write_only=True)
    smpp_port = serializers.IntegerField(required=False, min_value=1, max_value=65535, default=2775, write_only=True)
    smpp_system_id = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    smpp_password = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    smpp_template_id = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    smpp_source_addr_ton = serializers.IntegerField(required=False, min_value=0, max_value=255, default=5, write_only=True)
    smpp_source_addr_npi = serializers.IntegerField(required=False, min_value=0, max_value=255, default=0, write_only=True)
    smpp_dest_addr_ton = serializers.IntegerField(required=False, min_value=0, max_value=255, default=1, write_only=True)
    smpp_dest_addr_npi = serializers.IntegerField(required=False, min_value=0, max_value=255, default=1, write_only=True)
    smpp_data_coding = serializers.IntegerField(required=False, min_value=0, max_value=255, default=0, write_only=True)
    smpp_registered_delivery = serializers.BooleanField(required=False, default=True, write_only=True)

    def _validate_api_sender_id(self, value):
        sender_id = (value or '').strip()
        if not sender_id:
            raise serializers.ValidationError("Sender ID is required")

        cred = SMSCredential.objects.filter(is_active=True).first()
        env_user = getattr(settings, 'SMS_PROVIDER_USER', '').strip()
        env_password = getattr(settings, 'SMS_PROVIDER_PASSWORD', '').strip()
        if not cred and (not env_user or not env_password):
            raise serializers.ValidationError("SMS credentials not configured")

        return sender_id

    def validate(self, attrs):
        transport = attrs.get('transport') or 'api'
        sender_value = attrs.get('display_sender_id') or attrs.get('sender_id')
        normalized_sender = (sender_value or '').strip()
        if transport == 'smpp':
            if not normalized_sender:
                raise serializers.ValidationError({'display_sender_id': 'Sender ID is required for SMPP'})
            attrs['display_sender_id'] = normalized_sender
        else:
            attrs['display_sender_id'] = self._validate_api_sender_id(sender_value)
        attrs.pop('sender_id', None)

        send_mode = attrs.get('send_mode') or 'single'
        source_file = attrs.get('source_file')
        message_content = (attrs.get('message_content') or '').strip()

        if not message_content:
            raise serializers.ValidationError({'message_content': 'Message content is required'})

        if len(message_content) > 160:
            raise serializers.ValidationError({'message_content': 'SMS content must be 160 characters or less'})

        if send_mode == 'single':
            if not attrs.get('recipient_number'):
                raise serializers.ValidationError({'recipient_number': 'Recipient number is required for single mode'})

        if send_mode in ['file_numbers', 'personalized_file']:
            if not source_file:
                raise serializers.ValidationError({'source_file': 'Please upload a file'})

            if source_file.size > 50 * 1024 * 1024:
                raise serializers.ValidationError({'source_file': 'File size must be under 50MB'})

            lower_name = (source_file.name or '').lower()
            if send_mode == 'file_numbers' and not (
                lower_name.endswith('.txt') or lower_name.endswith('.xls') or lower_name.endswith('.xlsx')
            ):
                raise serializers.ValidationError({'source_file': 'Allowed formats: .txt, .xls, .xlsx'})

            if send_mode == 'personalized_file' and not (
                lower_name.endswith('.xls') or lower_name.endswith('.xlsx')
            ):
                raise serializers.ValidationError({'source_file': 'Allowed formats: .xls, .xlsx'})

        if send_mode == 'group' and not attrs.get('group_id'):
            raise serializers.ValidationError({'group_id': 'Group is required for group mode'})

        delivery_mode = attrs.get('delivery_mode') or 'instant'
        if delivery_mode == 'scheduled':
            if not attrs.get('timezone_name'):
                raise serializers.ValidationError({'timezone_name': 'Timezone is required for scheduled delivery'})
            if not attrs.get('start_date'):
                raise serializers.ValidationError({'start_date': 'Start date is required for scheduled delivery'})
            if not attrs.get('start_time'):
                raise serializers.ValidationError({'start_time': 'Start time is required for scheduled delivery'})

        if transport == 'smpp':
            required_fields = {
                'smpp_host': 'SMPP host is required',
                'smpp_system_id': 'SMPP system ID is required',
                'smpp_password': 'SMPP password is required',
            }
            for field_name, message in required_fields.items():
                if not str(attrs.get(field_name) or '').strip():
                    raise serializers.ValidationError({field_name: message})

            smpp_profile = attrs.get('smpp_profile') or 'standard'
            if smpp_profile == 'dlt' and not str(attrs.get('smpp_template_id') or '').strip():
                raise serializers.ValidationError({'smpp_template_id': 'Template ID is required for DLT SMPP sending'})

            if delivery_mode == 'scheduled':
                raise serializers.ValidationError({'delivery_mode': 'Scheduled delivery is not supported for SMPP sends'})

        return attrs

    def validate_recipient_number(self, value):
        normalized = ''.join(ch for ch in value if ch.isdigit())
        if len(normalized) < 10:
            raise serializers.ValidationError("Invalid phone number")
        return normalized


class SMSCredentialSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        sender_ids = attrs.get('sender_ids')
        if sender_ids is None and self.instance is not None:
            sender_ids = self.instance.sender_ids or []

        normalized_sender_ids = [str(item).strip() for item in (sender_ids or []) if str(item).strip()]
        free_trial_sender = str(attrs.get('free_trial_default_sender_id', self.instance.free_trial_default_sender_id if self.instance else '') or '').strip()

        if free_trial_sender and free_trial_sender not in normalized_sender_ids:
            raise serializers.ValidationError({'free_trial_default_sender_id': 'Select a sender ID from configured sender IDs'})

        return attrs

    class Meta:
        model = SMSCredential
        fields = ['user', 'password', 'sender_ids', 'free_trial_default_sender_id', 'is_active', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class UserSMSEligibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'last_name',
            'username',
            'email',
            'phone_number',
            'is_active',
            'is_sms_enabled',
            'sender_id_type',
            'sender_id',
            'free_trial_sender_id',
            'is_staff',
            'date_joined',
        ]


class SMSMessageStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSMessage
        fields = ['id', 'status', 'message_id', 'delivery_time', 'scheduled_at', 'created_at']


class SMSContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSContact
        fields = ['id', 'name', 'phone_number']


class SMSContactGroupSerializer(serializers.ModelSerializer):
    contacts = SMSContactSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = SMSContactGroup
        fields = ['id', 'name', 'member_count', 'contacts', 'created_at', 'updated_at']


class SMSContactGroupCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    members = serializers.ListField(child=serializers.CharField(max_length=200), allow_empty=False)


class SMSShortURLSerializer(serializers.ModelSerializer):
    short_url = serializers.CharField(read_only=True)

    class Meta:
        model = SMSShortURL
        fields = [
            'id', 'link_name', 'short_code', 'short_url', 'redirect_url',
            'is_active', 'total_clicks', 'last_clicked_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'short_code', 'short_url', 'total_clicks', 'last_clicked_at',
            'created_at', 'updated_at'
        ]


class NotificationRecipientPreviewSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return ' '.join([part for part in [obj.first_name, obj.last_name] if part]).strip()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_active', 'date_joined']


class AdminNotificationSendSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=5000)
    audience_filter = serializers.ChoiceField(choices=[choice[0] for choice in InternalNotification.AUDIENCE_CHOICES])


class AdminNotificationHistorySerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = InternalNotification
        fields = ['id', 'content', 'audience_filter', 'recipient_count', 'created_by', 'created_by_username', 'created_at']


class UserNotificationSerializer(serializers.ModelSerializer):
    content = serializers.CharField(source='notification.content', read_only=True)
    audience_filter = serializers.CharField(source='notification.audience_filter', read_only=True)
    notification_created_at = serializers.DateTimeField(source='notification.created_at', read_only=True)

    class Meta:
        model = InternalNotificationRecipient
        fields = ['id', 'notification', 'content', 'audience_filter', 'is_read', 'read_at', 'notification_created_at']

