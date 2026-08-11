package com.example

import android.content.Context
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import com.example.data.repository.SyncRepository
import com.example.ui.viewmodel.BitacoraViewModel

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("ESun Bitacora", appName)
  }

  @Test
  fun `test viewModel initialization`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val repository = SyncRepository(context)
    val viewModel = BitacoraViewModel(repository, context)
    org.junit.Assert.assertNotNull(viewModel)
  }

  @Test
  fun `test activity launch`() {
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      org.junit.Assert.assertNotNull(scenario)
    }
  }
}
